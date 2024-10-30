import type {PackageJSON} from '../types/PackageJSON';
import {readJSON} from './readJSON';

let cachedExternals: string[] | undefined;

export async function getServerExternals() {
    if (!cachedExternals) {
        let {dependencies = {}} = await readJSON<PackageJSON>('package.json');
        let depNames = Object.keys(dependencies);

        let nonModuleDeps = await Promise.all(
            depNames.map(async name => {
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
