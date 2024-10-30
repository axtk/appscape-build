import type {EntryPoint} from '../types/EntryPoint';
import {getEntries} from './getEntries';
import {getFirstAvailable} from './getFirstAvailable';

export async function getEntryPoints(name: string | string[]): Promise<EntryPoint[]> {
    let entries = await getEntries();

    let buildEntries = await Promise.all(
        entries.map(async entry => {
            let path = await getFirstAvailable(`src/entries/${entry}`, name);

            return path ? {in: path, out: entry} : undefined;
        }),
    );

    return buildEntries.filter(item => item !== undefined);
}
