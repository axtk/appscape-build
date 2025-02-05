#!/usr/bin/env node
import {rm} from 'node:fs/promises';
import {publicDir} from './const/publicDir';
import {build} from './build';

async function clean() {
    return Promise.all(
        ['dist/entries', 'dist/main', `${publicDir}/-`]
            .map(dir => rm(dir, {recursive: true, force: true})),
    );
}

async function run() {
    let args = process.argv.slice(2);

    if (args.includes('--clean-only')) {
        await clean();
        return;
    }

    if (args.includes('--clean'))
        await clean();

    await build({
        silent: args.includes('--silent'),
        init: args.includes('--init'),
        skipInit: args.includes('--skip-init'),
    });
}

(async () => {
    await run();
})();
