export function renderRootEntriesSection(entries: string[]) {
    const lines = [
        '## Project Root',
        '',
        'These are files and directories in project root, you can inform these to narrow search scopes or read exact file from root directory, note that things inside directories are not listed, directories end with `/`.',
        '',
        ...entries.map(v => `- ${v}`),
    ];
    return lines.join('\n');
}
