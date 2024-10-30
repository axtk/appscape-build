import type {EntryPoint} from '../types/EntryPoint';
import {getEntryPoints} from './getEntryPoints';

let entryPoints: EntryPoint[] | undefined;

export async function getClientEntryPoints() {
    if (!entryPoints)
        entryPoints = await getEntryPoints([
            'index',
            'client',
            'csr',
            'client/index',
            'csr/index',
        ]);

    return entryPoints;
}
