import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {getServerEntryPoints} from './getServerEntryPoints';
import {getServerExternals} from './getServerExternals';

export async function buildServerEntryPoints() {
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
}
