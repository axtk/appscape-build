import {formatDuration} from 'dtfm';
import {buildClient} from './utils/buildClient';
import {buildEntryIndex} from './utils/buildEntryIndex';
import {buildServer} from './utils/buildServer';
import {buildServerEntryPoints} from './utils/buildServerEntryPoints';
import {setup} from './utils/setup';

export type BuildParams = {
    silent?: boolean;
};

export async function build({silent}: BuildParams | void = {}) {
    let startTime = Date.now();
    let log = silent ? (() => {}) : console.log;

    log('Build started');

    await setup();
    await Promise.all([
        Promise.all([
            buildServerEntryPoints(),
            buildEntryIndex(),
        ]).then(() => buildServer()),
        buildClient(),
    ]);

    log(`Build completed (build time: ${formatDuration(Date.now() - startTime)})`);
}
