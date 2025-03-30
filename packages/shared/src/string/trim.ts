// `['foo', '/', 'bar', '/']`
const PATH_TRIM_SEGMENT_HEAD = 4;

// `['/', 'main.ts']`
const PATH_TRIM_SEGMENT_TAIL = 2;

export function trimPathString(path: string) {
    if (path.length <= 20) {
        return path;
    }

    const segments = path.split(/([/\\])/);

    if (segments.length <= PATH_TRIM_SEGMENT_HEAD + PATH_TRIM_SEGMENT_TAIL) {
        return path;
    }

    const before = segments.slice(0, PATH_TRIM_SEGMENT_HEAD).join('');
    const last = segments.slice(-PATH_TRIM_SEGMENT_TAIL).join('');
    return `${before}...${last}`;
}
