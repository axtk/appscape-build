import {unlink} from 'node:fs/promises';
import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {getEntryPoints} from './getEntryPoints';
import {toImportPath} from './toImportPath';
import {writeModifiedFile} from './writeModifiedFile';

export async function buildInit() {
    let fileName = `init_${Math.random().toString(36).slice(2)}`;
    let filePath = `src/main/${fileName}.ts`;

    let entryPoints = await getEntryPoints([
        'init',
        'init/index',
    ]);

    if (entryPoints.length === 0)
        return;

    let importList = '', callList = '';

    for (let i = 0; i < entryPoints.length; i++) {
        let importPath = toImportPath(entryPoints[i].in, 'src/main');
    
        importList += `import {init as init${i}} from '${importPath}';`;
        callList += `        init${i}(),`;
    }

    let content = `${importList}\n\n` +
        `(async () => {\n    await Promise.all([\n${callList}\n    ]);\n})();\n`;
    
    await writeModifiedFile(filePath, content);

    await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        outfile: 'dist/init.js',
        platform: 'node',
        ...commonBuildOptions,
    });

    await unlink(filePath);
}
