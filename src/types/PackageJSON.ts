type DependencyList = Record<string, string>;

export type PackageJSON = {
    name?: string;
    version?: string;
    type?: string;
    dependencies?: DependencyList;
    devDependencies?: DependencyList;
    peerDependencies?: DependencyList;
    optionalDependencies?: DependencyList;
};
