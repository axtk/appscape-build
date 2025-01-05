import {access, mkdir, rename} from 'node:fs/promises';
import {publicDir} from '../const/publicDir';
import {getEntries} from './getEntries';

export async function finalize() {
    let serverCSSFiles = (await Promise.all(
        (await getEntries()).map(async entry => {
            let path = `dist/entries/${entry}/server.css`;

            try {
                await access(path);

                return {entry, path};
            }
            catch {}
        }),
    )).filter(item => item !== undefined);

    await Promise.all(
        serverCSSFiles.map(async ({entry, path: sourcePath}) => {
            let targetPath = `${publicDir}/-/${entry}/index.css`;

            try {
                await access(`${publicDir}/-/${entry}`);
            }
            catch {
                await mkdir(`${publicDir}/-/${entry}`, {recursive: true});
            }

            try {
                await rename(sourcePath, targetPath);
            }
            catch {}
        }),
    );
}
