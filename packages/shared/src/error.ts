// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function assertNever<T = unknown>(value: never, stringify: (value: T) => string): never {
    throw new Error(stringify(value));
}

export function stringifyError(error: unknown) {
    return error instanceof Error ? error.message : `${error}`;
}

export function isAbortError(error: unknown): boolean {
    // NodeJS throws a simple `Error` object on `abortSignal.abort()`, not a `DOMException`.
    // Also note if `abortSignal.abort()` is called with `reason` argument, there is no way to check a abort error.
    return error instanceof Error && error.name === 'AbortError';
}

export function assertHasValue<T>(value: T | null | undefined, errorMessage: string): asserts value is T {
    if (!value) {
        throw new Error(errorMessage);
    }
}
