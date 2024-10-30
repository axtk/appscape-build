import {access, mkdir, readdir, rename, rm} from 'node:fs/promises';

export async function moveServerCSS() {
    try {
        let cssFiles = (await readdir('dist/entries'))
            .filter(name => name.endsWith('.css'));

        if (cssFiles.length === 0)
            return;

        try {
            await access('res/-');
        }
        catch {
            await mkdir('res/-');
        }

        await Promise.all(
            cssFiles.map(async name => {
                let sourcePath = `dist/entries/${name}`;
                let targetPath = `res/-/${name}`;

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
