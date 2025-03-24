import path from 'node:path';
import dedent from 'dedent';

export interface SemanticRewriteSnippetView {
    title: string;
    content: string;
}

export interface SemanticRewriteView {
    file: string;
    codeBefore: string;
    codeAfter: string;
    hint: string;
    snippets: SemanticRewriteSnippetView[];
}

function renderCodeAroundCursor(type: 'before' | 'after', code: string) {
    if (!code) {
        return 'There is no code ${type} cursor';
    }

    const lines = [
        'Here is code ${type} cursor:',
        '',
        '```',
        code,
        '```',
    ];
    return lines.join('\n');
}

function renderHint(hint: string) {
    const lines = [
        'The pseudo-code for the code to be generated at the cursor position is as follows:',
        '',
        '```',
        hint,
        '```',
    ];
    return lines.join('\n');
}

function renderSnippetItem(item: SemanticRewriteSnippetView) {
    return [item.title, item.content].join('\n\n');
}

export function renderSemanticRewritePrompt(view: SemanticRewriteView) {
    const extension = path.extname(view.file);
    const prefix = dedent`
        You are a programming expert on ${extension} files, now you will receive these inputs from editor:

        1. The file path in project
        2. A block of code before the cursor
        3. A block of code after the cursor
        4. A pseudo-code as a hint for the code to be generated at the cursor position

        Current file path is ${view.file}
    `;
    const suffix = dedent`
        Please note it is possible that some part of the code before or after cursor is also pseudo-code, you need to judge its effect or ignore this part.

        You should generate the final code to be inserted at the cursor position according to this pseudo-code, and meet the following requirements:

        1. Must follow the syntax of ${extension} file
        2. The generated code should be a complete logic when combined with the code before and after the cursor
        3. The generated code should only express the logic of the current pseudo-code, do not guess or add any logic in addition
        4. If the pseudo-code given above is already a syntax that is legal in the context of current file, then return this part directly without making any changes
        5. Pay attention to the indentation of the code before and after the cursor, each line of your generated code must be prefixed with correct indentation
        6. Only return the generated code, do not output any markdown text

    `;
    const sections = [
        prefix,
        renderCodeAroundCursor('before', view.codeBefore),
        renderCodeAroundCursor('after', view.codeAfter),
        renderHint(view.hint),
        ...view.snippets.map(renderSnippetItem),
        suffix,
    ];
    return sections.join('\n\n');
}
