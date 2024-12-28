import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {getServerEntryPoints} from './getServerEntryPoints';
import {getServerExternals} from './getServerExternals';

export async function buildServerEntryPoints() {
    let [entryPoints, external] = await Promise.all([
        getServerEntryPoints(),
        getServerExternals(),
    ]);

    await Promise.all(
        entryPoints.map(({in: path, out: entry}) =>
            esbuild.build({
                entryPoints: [path],
                bundle: true,
                outfile: `dist/entries/${entry}/server.js`,
                platform: 'node',
                external,
                ...commonBuildOptions,
            })
        ),
    );
}
