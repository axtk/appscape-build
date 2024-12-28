import {access, mkdir, writeFile, unlink} from 'node:fs/promises';
import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {getEntryPoints} from './getEntryPoints';
import {toImportPath} from './toImportPath';
import {writeModifiedFile} from './writeModifiedFile';

let outputPath = 'dist/init.js';

export async function buildInit() {
    let fileName = `init_${Math.random().toString(36).slice(2)}`;
    let inputPath = `src/main/${fileName}.ts`;

    let entryPoints = await getEntryPoints([
        'init',
        'init/index',
    ]);

    if (entryPoints.length === 0) {
        try {
            await access('dist');
        }
        catch {
            await mkdir('dist');
        }

        await writeFile(outputPath, '');

        return;
    }

    let importList = '', callList = '';

    for (let i = 0; i < entryPoints.length; i++) {
        let importPath = toImportPath(entryPoints[i].in, 'src/main');
    
        importList += `import {init as init${i}} from '${importPath}';`;
        callList += `        init${i}(),`;
    }

    let content = `${importList}\n\n` +
        `(async () => {\n    await Promise.all([\n${callList}\n    ]);\n})();\n`;
    
    await writeModifiedFile(inputPath, content);

    await esbuild.build({
        entryPoints: [inputPath],
        bundle: true,
        outfile: outputPath,
        platform: 'node',
        ...commonBuildOptions,
    });

    await unlink(inputPath);
}