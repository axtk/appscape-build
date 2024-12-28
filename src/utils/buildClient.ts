import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {publicDir} from '../const/publicDir';
import {getClientEntryPoints} from './getClientEntryPoints';

export async function buildClient() {
    let entryPoints = await getClientEntryPoints();

    await Promise.all(
        entryPoints.map(({in: path, out: entry}) =>
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
