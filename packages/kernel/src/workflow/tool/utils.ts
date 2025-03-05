export function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

export function resultMarkdown(title: string, content: string, langauge = '') {
    return `${title}\n\n${codeBlock(content, langauge)}`;
}
