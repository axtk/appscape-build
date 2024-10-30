import type {PackageJSON} from '../types/PackageJSON';
import {readJSON} from './readJSON';

let cachedExternals: string[] | undefined;

export async function getServerExternals() {
    if (!cachedExternals) {
        let {
            dependencies = {},
            devDependencies = {},
            peerDependencies = {},
            optionalDependencies = {},
        } = await readJSON<PackageJSON>('package.json');

        let deps = new Set([
            ...Object.keys(dependencies),
            ...Object.keys(devDependencies),
            ...Object.keys(peerDependencies),
            ...Object.keys(optionalDependencies),
        ]);

        let nonModuleDeps = await Promise.all(
            Array.from(deps).map(async name => {
                let {type} = await readJSON<PackageJSON>(
                    `node_modules/${name}/package.json`,
                );

                return type === 'module' ? undefined : name;
            }),
        );

        cachedExternals = nonModuleDeps.filter(name => name !== undefined);
    }

    return cachedExternals;
}
