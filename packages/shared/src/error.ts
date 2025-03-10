// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function assertNever<T = unknown>(value: never, stringify: (value: T) => string): never {
    throw new Error(stringify(value));
}

export function stringifyError(error: unknown) {
    return error instanceof Error ? error.message : `${error}`;
}

export function isAbortError(error: unknown): error is DOMException {
    return error instanceof DOMException && error.name === 'AbortError';
}

export function assertHasValue<T>(value: T | null | undefined, errorMessage: string): asserts value is T {
    if (!value) {
        throw new Error(errorMessage);
    }
}
