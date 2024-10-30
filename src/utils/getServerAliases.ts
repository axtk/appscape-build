import {join} from 'node:path';
import {getServerEntryPoints} from './getServerEntryPoints';
import {toImportPath} from './toImportPath';

let aliases: Record<string, string> = {};
let inited = false;

export async function getServerAliases() {
    if (!inited) {
        let entryPoints = await getServerEntryPoints();

        for (let {in: path, out: name} of entryPoints)
            aliases[toImportPath(path)] = join(
                process.cwd(),
                `dist/entries/${name}.js`,
            );
    }

    return aliases;
}
