import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {getServerExternals} from './getServerExternals';

export async function buildServer() {
    let external = await getServerExternals();

    await esbuild.build({
        entryPoints: ['src/main/index.ts'],
        bundle: true,
        outdir: 'dist/main',
        platform: 'node',
        external: [...external, '../entries/*'],
        ...commonBuildOptions,
    });
}
