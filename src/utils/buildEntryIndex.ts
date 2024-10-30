import {readFile, writeFile} from 'node:fs/promises';
import {getServerEntryPoints} from './getServerEntryPoints';
import {toCamelCase} from './toCamelCase';
import {toImportPath} from './toImportPath';

export async function buildEntryIndex() {
    let path = 'src/main/entries.ts';
    let entryPoints = await getServerEntryPoints();

    let content = '// Populated automatically during the build phase\n';

    if (entryPoints.length === 0)
        content += 'export const entries = [];\n';
    else {
        let importList = '', exportList = '';

        for (let {in: entryPath, out: entryName} of entryPoints) {
            let importPath = toImportPath(entryPath);
            let importName = toCamelCase(entryName);

            importList += `import {server as ${importName}} from '${importPath}';\n`;
            exportList += `    ${importName},\n`;
        }

        content += `${importList}\nexport const entries = [\n${exportList}];\n`;
    }

    try {
        let prevContent = (await readFile(path)).toString();

        if (content === prevContent)
            return;
    }
    catch {}

    return writeFile(path, content);
}
