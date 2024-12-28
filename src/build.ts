import {formatDuration} from 'dtfm';
import type {BuildParams} from './types/BuildParams';
import {buildClient} from './utils/buildClient';
import {buildServer} from './utils/buildServer';
import {finalize} from './utils/finalize';

export async function build(params: BuildParams) {
    let startTime = Date.now();
    let log = params.silent ? (() => {}) : console.log;

    log('Build started');

    await Promise.all([
        buildServer(params),
        buildClient(),
    ]);
    await finalize();

    log(`Build completed (build time: ${formatDuration(Date.now() - startTime)})`);
}
