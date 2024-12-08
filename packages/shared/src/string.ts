export function stringifyError(error: unknown) {
    return error instanceof Error ? error.message : `${error}`;
}
