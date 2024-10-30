import {access, copyFile, mkdir, readdir} from 'node:fs/promises';
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
