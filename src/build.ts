import {access, copyFile, lstat, mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join, relative, posix, sep} from 'node:path';
import esbuild, {type BuildOptions} from 'esbuild';
import {formatDuration} from 'dtfm';

const entryExtensions = ['js', 'jsx', 'ts', 'tsx'];

const dev = process.env.NODE_ENV === 'development';
const cwd = process.cwd();

type EntryPoint = {
    in: string;
    out: string;
};

type PackageJSON = {
    type?: string;
    dependencies?: Record<string, string>;
};

let cachedServerExternals: string[] | undefined;
let cachedEntries: Record<string, EntryPoint[]> = {};
let serverAliases: Record<string, string> = {};

async function readJSON<T = unknown>(path: string) {
    try {
        return JSON.parse(
            (await readFile(join(cwd, path))).toString(),
        ) as T;
    }
    catch {
        return {} as T;
    }
}

async function getServerExternals() {
    if (!cachedServerExternals) {
        let {dependencies = {}} = await readJSON<PackageJSON>('package.json');
        let depNames = Object.keys(dependencies);

        let nonModuleDeps = await Promise.all(
            depNames.map(async name => {
                let {type} = await readJSON<PackageJSON>(
                    `node_modules/${name}/package.json`,
                );

                return type === 'module' ? undefined : name;
            }),
        );

        cachedServerExternals = nonModuleDeps.filter(name => name !== undefined);
    }

    return cachedServerExternals;
}

async function getEntries() {
    try {
        let list = await readdir(join(cwd, 'src/entries'));

        let dirs = await Promise.all(
            list.map(async name => {
                let itemStat = await lstat(join(cwd, 'src/entries', name));

                return itemStat.isDirectory() ? name : undefined;
            }),
        );

        return dirs.filter(dir => dir !== undefined);
    }
    catch {
        return [];
    }
}

async function getFirstAvailable(dirPath: string, name: string | string[]) {
    let names = Array.isArray(name) ? name : [name];

    for (let fileName of names) {
        for (let ext of entryExtensions) {
            let path = join(cwd, dirPath, `${fileName}.${ext}`);

            try {
                await access(path);
                return path;
            }
            catch {}
        }
    }
}

async function getEntryPoints(name: string | string[]): Promise<EntryPoint[]> {
    let entries = await getEntries();
    let buildEntries = await Promise.all(
        entries.map(async entry => {
            let path = await getFirstAvailable(`src/entries/${entry}`, name);
            return path ? [path, entry] : undefined;
        }),
    );

    return buildEntries
        .filter(item => item !== undefined)
        .map(([path, entry]) => ({in: path, out: entry}));
}

async function getClientEntryPoints() {
    if (!cachedEntries.client)
        cachedEntries.client = await getEntryPoints([
            'index',
            'client',
            'csr',
            'client/index',
            'csr/index',
        ]);

    return cachedEntries.client;
}

async function getServerEntryPoints() {
    if (!cachedEntries.server)
        cachedEntries.server = await getEntryPoints([
            'server',
            'ssr',
            'server/index',
            'ssr/index',
        ]);

    return cachedEntries.server;
}

const commonBuildOptions: Partial<BuildOptions> = {
    jsx: 'automatic',
    jsxDev: dev,
    loader: {
        '.png': 'dataurl',
        '.svg': 'dataurl',
        '.html': 'text',
        '.txt': 'text',
    },
};

async function setup() {
    let dirs = ['res/-', 'dist/main', 'dist/entries'];

    await Promise.all(
        dirs.map(dir => rm(dir, {force: true, recursive: true})),
    );
}

async function buildServer() {
    let external = await getServerExternals();

    await esbuild.build({
        entryPoints: ['src/main/index.ts'],
        bundle: true,
        outdir: 'dist/main',
        platform: 'node',
        alias: serverAliases,
        external: [...external, './dist/entries/*'],
        ...commonBuildOptions,
    });
}

async function buildClient() {
    let entryPoints = await getClientEntryPoints();

    await esbuild.build({
        entryPoints,
        bundle: true,
        splitting: true,
        format: 'esm',
        outdir: 'res/-',
        minify: !dev,
        ...commonBuildOptions,
    });
}

async function buildServerEntryPoints() {
    let [entryPoints, external] = await Promise.all([
        getServerEntryPoints(),
        getServerExternals(),
    ]);

    await esbuild.build({
        entryPoints,
        bundle: true,
        outdir: 'dist/entries',
        platform: 'node',
        external,
        ...commonBuildOptions,
    });

    try {
        let files = (await readdir('dist/entries'))
            .filter(name => name.endsWith('.css'));

        if (files.length === 0)
            return;

        try {
            await access('res/-');
        }
        catch {
            await mkdir('res/-');
        }

        await Promise.all(
            files.map(name => copyFile(`dist/entries/${name}`, `res/-/${name}`)),
        );
    }
    catch {
        // ok, no 'dist/entries'
    }
}

function toCamelCase(s: string) {
    let prefix = s.match(/^[\s_-]+/)?.[0] ?? '';
    let t = s
        .slice(prefix.length)
        .replace(/[\s_-](\w)/g, (_, c) => c.toUpperCase());

    return prefix + t;
}

function toImportPath(path: string) {
    let importPath = posix.join(...relative(cwd, path).split(sep))
        .replace(/(\/index)?\.[jt]sx?$/, '');

    return `~/${importPath}`;
}

async function buildEntryIndex() {
    let path = 'src/main/entries.ts';
    let entryPoints = await getServerEntryPoints();

    let content = '// Populated automatically during the build phase\n';

    if (entryPoints.length === 0)
        content += 'export const entries = [];\n';
    else {
        let importList = '', exportList = '';

        for (let {in: entryPath, out: entryName} of entryPoints) {
            let importPath = toImportPath(entryPath);
            let importName = toCamelCase(entryName);

            importList += `import {server as ${importName}} from '${importPath}';\n`;
            exportList += `    ${importName},\n`;

            serverAliases[importPath] = join(cwd, `dist/entries/${entryName}.js`);
        }

        content += `${importList}\nexport const entries = [\n${exportList}];\n`;
    }

    try {
        let prevContent = (await readFile(path)).toString();

        if (content === prevContent)
            return;
    }
    catch {}

    return writeFile(path, content);
}

export type BuildParams = {
    silent?: boolean;
};

export async function build({silent}: BuildParams | void = {}) {
    let startTime = Date.now();
    let log = silent ? (() => {}) : console.log;

    log('Build started');

    await setup();
    await Promise.all([
        Promise.all([
            buildServerEntryPoints(),
            buildEntryIndex(),
        ]).then(() => buildServer()),
        buildClient(),
    ]);

    log(`Build completed (build time: ${formatDuration(Date.now() - startTime)})`);
}
