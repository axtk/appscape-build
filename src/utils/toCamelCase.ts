export function toCamelCase(s: string) {
    let prefix = s.match(/^[\s_-]+/)?.[0] ?? '';

    let t = s
        .slice(prefix.length)
        .replace(/[\s_-](\w)/g, (_, c) => c.toUpperCase());

    return prefix + t;
}
