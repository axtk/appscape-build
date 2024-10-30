import {relative, posix, sep} from 'node:path';

export function toImportPath(relativePath: string) {
    let importPath = posix
        .join(...relative(process.cwd(), relativePath).split(sep))
        .replace(/(\/index)?\.[jt]sx?$/, '');

    return `~/${importPath}`;
}
