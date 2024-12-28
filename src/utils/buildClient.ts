import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {publicDir} from '../const/publicDir';
import {getEntryPoints} from './getEntryPoints';

export async function buildClient() {
    let clientEntries = await getEntryPoints([
        'client',
        'client/index',
    ]);

    await Promise.all(
        clientEntries.map(({entry, path}) =>
            esbuild.build({
                entryPoints: [path],
                bundle: true,
                splitting: true,
                format: 'esm',
                outdir: `${publicDir}/-/${entry}`,
                minify: process.env.NODE_ENV !== 'development',
                ...commonBuildOptions,
            })
        ),
    );
}
