import {access} from 'node:fs/promises';
import {join} from 'node:path';
import {entryExtensions} from '../const/entryExtensions';

export async function getFirstAvailable(
    dirPath: string,
    name: string | string[],
) {
    let names = Array.isArray(name) ? name : [name];

    for (let fileName of names) {
        for (let ext of entryExtensions) {
            let path = join(process.cwd(), dirPath, `${fileName}.${ext}`);

            try {
                await access(path);

                return path;
            }
            catch {}
        }
    }
}
