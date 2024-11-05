import {rm} from 'node:fs/promises';
import {publicDir} from '../const/publicDir';

let dirs = [
    `${publicDir}/-`,
    'dist/main',
    'dist/entries',
];

export async function setup() {
    await Promise.all(
        dirs.map(dir => rm(dir, {force: true, recursive: true})),
    );
}
