import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

export async function readJSON<T = unknown>(relativePath: string) {
    let path = join(process.cwd(), relativePath);

    try {
        return JSON.parse((await readFile(path)).toString()) as T;
    }
    catch {
        return {} as T;
    }
}
