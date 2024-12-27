import {readFile, writeFile} from 'node:fs/promises';

export async function writeModifiedFile(
    path: string,
    content: string,
) {
    try {
        let prevContent = (await readFile(path)).toString();

        if (content === prevContent)
            return;
    }
    catch {}

    return writeFile(path, content);
}
