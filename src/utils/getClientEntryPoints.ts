import type {EntryPoint} from '../types/EntryPoint';
import {getEntryPoints} from './getEntryPoints';

let entryPoints: EntryPoint[] | undefined;

export async function getClientEntryPoints() {
    if (!entryPoints)
        entryPoints = await getEntryPoints([
            'client/index',
            'ui/index',
        ]);

    return entryPoints;
}
