import {rm} from 'node:fs/promises';

let dirs = [
    'res/-',
    'dist/main',
    'dist/entries',
];

export async function setup() {
    await Promise.all(
        dirs.map(dir => rm(dir, {force: true, recursive: true})),
    );
}
