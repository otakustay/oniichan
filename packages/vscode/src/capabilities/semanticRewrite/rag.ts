import {languages, Range, Uri} from 'vscode';
import {EnhancedContextSnippet} from '../../api/semanticRewrite';
import {isLineEndsWithIdentifier} from '@oniichan/shared/language';

function isRangeAtLine(range: Range, line: number) {
    return range.isSingleLine && range.start.line === line;
}

export interface RagInput {
    documentUri: Uri;
    line: number;
    hint: string;
}

export function retrieveEnhancedContext(input: RagInput): EnhancedContextSnippet[] {
    if (isLineEndsWithIdentifier(input.hint)) {
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
