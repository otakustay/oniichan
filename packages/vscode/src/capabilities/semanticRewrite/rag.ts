import {languages, Range, Uri} from 'vscode';
import {EnhancedContextSnippet} from '../../api/semanticRewrite';
import {getLanguageConfig} from '@oniichan/shared/language';

function isRangeAtLine(range: Range, line: number) {
    return range.isSingleLine && range.start.line === line;
}

export interface RagInput {
    documentUri: Uri;
    languageId: string;
    line: number;
    hint: string;
}

export function retrieveEnhancedContext(input: RagInput): EnhancedContextSnippet[] {
    const language = getLanguageConfig(input.languageId);
    if (language.endsWithIdentifier(input.hint)) {
        return [];
    }

    const diagnostics = languages.getDiagnostics(input.documentUri).filter(v => isRangeAtLine(v.range, input.line));
    return [
        {
            label: 'dianostics',
            title: 'These are problems reported at cursor, you should also try to fix them.',
            content: diagnostics.map(v => v.message).map(v => `- ${v}`).join('\n'),
        },
    ];
}
