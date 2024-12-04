import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {toImportPath} from './toImportPath';

export type BuildIndexParams = {
    outDir: string;
    exportName: string;
    importPaths: string[];
    importName: string;
};

export async function buildIndex({
    outDir,
    importPaths,
    importName,
    exportName,
}: BuildIndexParams) {
    let path = join(outDir, `${exportName}.ts`);
    let content = '// Populated automatically during the build phase\n';

    if (importPaths.length === 0)
        content += `export const ${exportName} = [];\n`;
    else {
        let importList = '', exportList = '';

        for (let i = 0; i < importPaths.length; i++) {
            importList += `import {${importName} as ${importName}${i}} ` +
                `from '${toImportPath(importPaths[i], outDir)}';\n`;
            exportList += `    ${importName}${i},\n`;
        }

        content += `${importList}\nexport const ${exportName} = [\n${exportList}];\n`;
    }

    try {
        let prevContent = (await readFile(path)).toString();

        if (content === prevContent)
            return;
    }
    catch {}

    return writeFile(path, content);
}
