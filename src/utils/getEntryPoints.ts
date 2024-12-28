import {getEntries} from './getEntries';
import {getFirstAvailable} from './getFirstAvailable';

type EntryPoint = {
    entry: string;
    path: string;
};

export async function getEntryPoints(name: string | string[]): Promise<EntryPoint[]> {
    let entries = await getEntries();

    return (await Promise.all(
        entries.map(async entry => {
            let path = await getFirstAvailable(`src/entries/${entry}`, name);

            return path === undefined ? undefined : {entry, path};
        }),
    )).filter(item => item !== undefined);
}
