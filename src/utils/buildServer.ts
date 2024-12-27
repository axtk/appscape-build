import {readFile, writeFile} from 'node:fs/promises';
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

    let filePath = 'dist/main/index.js';
    let content = (await readFile(filePath)).toString();

    let k0 = content.indexOf('// src/main/entries.ts');
    let k1 = k0 === -1 ? -1 : content.indexOf('// src/main/index.ts', k0);

    if (k0 === -1)
        return;

    if (k1 === -1)
        k1 = content.length;

    let entriesContent = content.slice(k0, k1).replace(
        /(['"])(\.\.\/entries\/\S+)\/server(['"])/g,
        '$1$2$3',
    );

    content = content.slice(0, k0) + entriesContent + content.slice(k1);

    await writeFile(filePath, content);
}
