export function stringifyError(error: unknown) {
    return error instanceof Error ? error.message : `${error}`;
}

export function now() {
    return (new Date()).toISOString();
}
