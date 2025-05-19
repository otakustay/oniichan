import type {RawToolCallParameter} from '@oniichan/shared/inbox';

export function asString(value: RawToolCallParameter, trim = false) {
    return typeof value === 'string' ? (trim ? value.trim() : value) : undefined;
}

function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

export function resultMarkdown(title: string, content: string, langauge = '') {
    return `${title}\n\n${codeBlock(content, langauge)}`;
}
