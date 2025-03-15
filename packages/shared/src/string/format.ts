export function now() {
    return (new Date()).toISOString();
}

export function countNounSimple(count: number, noun: string) {
    if (noun.endsWith('s') || noun.endsWith('x') || noun.endsWith('z') || noun.endsWith('ch') || noun.endsWith('sh')) {
        return `${count} ${noun}es`;
    }
    else {
        return `${count} ${noun}s`;
    }
}

export function ensureString(value: string | string[] | undefined) {
    return value === undefined ? '' : (typeof value === 'string' ? value : value.join(''));
}
