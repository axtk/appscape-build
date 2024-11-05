import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {publicDir} from '../const/publicDir';
import {getClientEntryPoints} from './getClientEntryPoints';

export async function buildClient() {
    let entryPoints = await getClientEntryPoints();

    await esbuild.build({
        entryPoints,
        bundle: true,
        splitting: true,
        format: 'esm',
        outdir: `${publicDir}/-`,
        minify: process.env.NODE_ENV !== 'development',
        ...commonBuildOptions,
    });
}
