import type {EntryPoint} from '../types/EntryPoint';
import {getEntryPoints} from './getEntryPoints';

let entryPoints: EntryPoint[] | undefined;

export async function getServerEntryPoints() {
    if (!entryPoints)
        entryPoints = await getEntryPoints([
            'server',
            'ssr',
            'server/index',
            'ssr/index',
        ]);

    return entryPoints;
}
