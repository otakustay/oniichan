import {directories as defaultIgnoreDirectories} from 'ignore-by-default';

export async function* streamingListEntries(root: string): AsyncIterable<string> {
    const options = {
        cwd: root,
        gitignore: true,
        ignore: defaultIgnoreDirectories().map(v => `**/${v}`),
        markDirectories: true,
        onlyFiles: false,
        dot: true,
    };
    const {globbyStream} = await import('globby');
    for await (const file of globbyStream('**', options)) {
        yield file.toString();
    }
}
