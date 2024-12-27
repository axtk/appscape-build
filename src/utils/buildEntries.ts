import {unlink} from 'node:fs/promises';
import esbuild from 'esbuild';
import {commonBuildOptions} from '../const/commonBuildOptions';
import {getEntryPoints} from './getEntryPoints';
import {toImportPath} from './toImportPath';
import {writeModifiedFile} from './writeModifiedFile';

export async function buildEntries() {
    let fileName = `__build${process.cwd().length}`;
    let filePath = `src/main/${fileName}.ts`;

    let entryPoints = await getEntryPoints([
        'build',
        'build/index',
    ]);

    if (entryPoints.length === 0)
        return;

    let importList = '', callList = '';

    for (let i = 0; i < entryPoints.length; i++) {
        let importPath = toImportPath(entryPoints[i].in, 'src/main');
    
        importList += `import {build as build${i}} from '${importPath}';`;
        callList += `        build${i}(),`;
    }

    let content = `${importList}\n\n` +
        `(async () => {\n    await Promise.all([\n${callList}\n    ]);\n})();\n`;
    
    await writeModifiedFile(filePath, content);

    await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        outfile: 'dist/main/build.js',
        platform: 'node',
        ...commonBuildOptions,
    });

    await unlink(filePath);
}
