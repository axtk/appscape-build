import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {getServerAliases} from './getServerAliases';
import {getServerExternals} from './getServerExternals';

export async function buildServer() {
    let [alias, external] = await Promise.all([
        getServerAliases(),
        getServerExternals(),
    ]);

    await esbuild.build({
        entryPoints: ['src/main/index.ts'],
        bundle: true,
        outdir: 'dist/main',
        platform: 'node',
        alias,
        external: [...external, './dist/entries/*'],
        ...commonBuildOptions,
    });
}
