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
    return getEntryPoints([
        'index',
        'client',
        'csr',
        'client/index',
        'csr/index',
    ]);
}

async function getServerEntryPoints() {
    return getEntryPoints([
        'server',
        'ssr',
        'server/index',
        'ssr/index',
    ]);
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
    await esbuild.build({
        entryPoints: ['src/main/index.ts'],
        bundle: true,
        outdir: 'dist/main',
        platform: 'node',
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

async function buildServerCSS() {
    let entryPoints = await getServerEntryPoints();

    await esbuild.build({
        entryPoints,
        bundle: true,
        outdir: 'dist/entries',
        platform: 'node',
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
    return s
        .replace(/(^[\s_-]|[\s_-]$)/g, '')
        .replace(/[\s_-](\w)/g, (_, c) => c.toUpperCase());
}

function toEntryImport({in: path, out: name}: EntryPoint) {
    let importPath = posix.join(
        ...relative(cwd, path).replace(/(\/index)?\.[jt]sx?$/, '').split(sep),
    );

    return `import {server as ${toCamelCase(name)}} from '~/${importPath}';`;
}

function toEntryExportItem({out: name}: EntryPoint) {
    return `    ${toCamelCase(name)},`;
}

async function buildEntryIndex() {
    let path = 'src/main/entries.ts';
    let entryPoints = await getServerEntryPoints();

    let content = '// Populated automatically during the build phase\n';

    if (entryPoints.length === 0)
        content += 'export const entries = [];';
    else {
        let importList = entryPoints.map(toEntryImport).join('\n');
        let entryList = entryPoints.map(toEntryExportItem).join('\n');

        content += `${importList}\n\nexport const entries = [\n${entryList}\n];\n`;
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
    let log = silent ? (() => {}) : console.log;
    let startTime = Date.now();

    log('Build started');

    await setup();
    await buildEntryIndex();
    await buildServerCSS();
    await Promise.all([
        buildServer(),
        buildClient(),
    ]);

    log(`Build completed (build time: ${formatDuration(Date.now() - startTime)})`);
}
