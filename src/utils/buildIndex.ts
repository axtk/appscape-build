import {join} from 'node:path';
import {toImportPath} from './toImportPath';
import {writeModifiedFile} from './writeModifiedFile';

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

    return writeModifiedFile(path, content);
}
