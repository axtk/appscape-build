#!/usr/bin/env node
import {rm} from 'node:fs/promises';
import {buildInit} from './utils/buildInit';
import {buildEntryIndex} from './utils/buildEntryIndex';
import {build} from './build';

async function clean() {
    return rm('dist', {recursive: true, force: true});
}

async function run() {
    let args = process.argv.slice(2);

    if (args.includes('--clean-only')) {
        await clean();
        return;
    }

    if (args.includes('--init')) {
        await clean();
        await Promise.all([
            buildEntryIndex(),
            buildInit(),
        ]);
        return;
    }

    if (args.includes('--clean'))
        await clean();

    await build({
        silent: args.includes('--silent'),
    });
}

(async () => {
    await run();
})();
