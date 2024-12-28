import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import type {BuildParams} from '../types/BuildParams';
import {getEntryPoints} from './getEntryPoints';
import {getServerExternals} from './getServerExternals';
import {toImportPath} from './toImportPath';
import {writeModifiedFile} from './writeModifiedFile';

export async function buildServer({init, skipInit}: BuildParams) {
    let [serverEntries, initEntries, external] = await Promise.all([
        skipInit ? [] : getEntryPoints([
            'server',
            'server/index',
        ]),
        skipInit ? [] : getEntryPoints([
            'init',
            'init/index',
        ]),
        getServerExternals(),
    ]);

    if (!skipInit)
        await Promise.all([
            ...serverEntries.map(({entry, path}) =>
                esbuild.build({
                    entryPoints: [path],
                    bundle: true,
                    outfile: `dist/entries/${entry}/server.js`,
                    platform: 'node',
                    external,
                    ...commonBuildOptions,
                })
            ),
            ...initEntries.map(({entry, path}) =>
                esbuild.build({
                    entryPoints: [path],
                    bundle: true,
                    outfile: `dist/entries/${entry}/init.js`,
                    platform: 'node',
                    external,
                    ...commonBuildOptions,
                })
            ),
            (async () => {
                let head: string[] = [];
                let tail: string[] = [];

                if (serverEntries.length === 0)
                    tail.push(
                        '\n// Returns all `server` exports from `src/entries/*/server(/index)?.(js|ts)`' +
                        '\nexport const server = [];',
                    );
                else {
                    tail.push('\nexport const server = [');

                    for (let i = 0; i < serverEntries.length; i++) {
                        head.push(
                            `import {server as server${i}} from ` +
                            `'${toImportPath(serverEntries[i].path, 'src/main')}';`,
                        );
                        tail.push(`    server${i},`);
                    }

                    tail.push('];');
                }

                if (initEntries.length === 0)
                    tail.push(
                        '\n// Calls all `init` exports from `src/entries/*/init(/index)?.(js|ts)`' +
                        '\nexport /* async */ function init() {}',
                    );
                else {
                    tail.push(
                        '\nexport async function init() {' +
                        '\n    await Promise.all([',
                    );

                    for (let i = 0; i < initEntries.length; i++) {
                        head.push(
                            `import {init as init${i}} from ` +
                            `'${toImportPath(initEntries[i].path, 'src/main')}';`,
                        );
                        tail.push(`        init${i}(),`);
                    }

                    tail.push('    ]);\n}');
                }

                return writeModifiedFile(
                    'src/main/entries.ts',
                    '// Populated automatically during the build phase\n' +
                    head.join('\n') + '\n' +
                    tail.join('\n') + '\n',
                );
            })(),
        ]);

    if (!init)
        await esbuild.build({
            entryPoints: ['src/main/index.ts'],
            bundle: true,
            outdir: 'dist/main',
            platform: 'node',
            external: [...external, '../entries/*'],
            ...commonBuildOptions,
        });
}
