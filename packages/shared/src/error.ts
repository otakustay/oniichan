// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function assertNever<T = unknown>(value: never, stringify: (value: T) => string): never {
    throw new Error(stringify(value));
}

export function stringifyError(error: unknown) {
    return error instanceof Error ? error.message : `${error}`;
}
