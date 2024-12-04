import {getServerEntryPoints} from './getServerEntryPoints';
import {buildIndex} from './buildIndex';

export async function buildEntryIndex() {
    return buildIndex({
        outDir: 'src/main',
        exportName: 'entries',
        importPaths: (await getServerEntryPoints()).map(({in: path}) => path),
        importName: 'server',
    });
}
