import {join} from 'node:path';
import {getServerEntryPoints} from './getServerEntryPoints';
import {toImportPath} from './toImportPath';

let aliases: Record<string, string> = {};
let inited = false;

/**
 * Collects the `alias` build option value allowing to mark
 * all server entries as external without injecting them into
 * the main bundle and to replace `entries/*` imports with
 * the aliases pointing to the compiled entries.
 */
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
