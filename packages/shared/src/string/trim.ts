const PATH_TRIM_SEGMENT_HEAD = 4;

const PATH_TRIM_SEGMENT_TAIL = 2;

export function trimPathString(path: string) {
    if (path.length <= 20) {
        return path;
    }

    const segments = path.split(/([/\\])/);

    // The `segments` includes delimiter like `/`, so `foo/bar` is `['foo', '/', 'bar']`,
    // we have `n * 2 - 1` items if `path` consists of `n` parts.
    if (segments.length <= (PATH_TRIM_SEGMENT_HEAD + PATH_TRIM_SEGMENT_TAIL) * 2 - 1) {
        return path;
    }

    const before = segments.slice(0, PATH_TRIM_SEGMENT_HEAD).join('');
    const last = segments.slice(-PATH_TRIM_SEGMENT_TAIL).join('');
    return `${before}...${last}`;
}

export interface JoinToMaxLengthResult {
    value: string;
    includedItems: number;
}

export function joinToMaxLength(array: string[], separator: string, maxLength: number) {
    const output: JoinToMaxLengthResult = {
        value: '',
        includedItems: 0,
    };
    for (const item of array) {
        const next = output.includedItems === 0 ? item : output.value + separator + item;

        if (next.length > maxLength) {
            return output;
        }

        output.value = next;
        output.includedItems++;
    }

    return output;
}
