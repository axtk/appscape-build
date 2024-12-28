import {access, mkdir, rename, rm} from 'node:fs/promises';
import {publicDir} from '../const/publicDir';
import {getServerEntryPoints} from './getServerEntryPoints';

export async function moveServerCSS() {
    try {
        let cssFiles = (await Promise.all(
            (await getServerEntryPoints()).map(async ({out: entry}) => {
                let path = `dist/entries/${entry}/server.css`;

                try {
                    await access(path);

                    return path;
                }
                catch {}
            }),
        )).filter(path => path !== undefined);

        if (cssFiles.length === 0)
            return;

        try {
            await access(`${publicDir}/-`);
        }
        catch {
            await mkdir(`${publicDir}/-`);
        }

        await Promise.all(
            cssFiles.map(async sourcePath => {
                let entry = sourcePath.split('/').at(-2);
                let targetPath = `${publicDir}/-/${entry}/index.css`;

                try {
                    await access(`${publicDir}/-/${entry}`);
                }
                catch {
                    await mkdir(`${publicDir}/-/${entry}`);
                }

                try {
                    await access(targetPath);
                    await rm(sourcePath);
                }
                catch {
                    await rename(sourcePath, targetPath);
                }
            }),
        );
    }
    catch {
        // ok, no 'dist/entries'
    }
}
