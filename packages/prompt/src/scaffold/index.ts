import path from 'node:path';
import dedent from 'dedent';

export interface ScaffoldSnippetView {
    path: string;
    content: string;
}

export interface ScaffoldView {
    file: string;
    snippets: ScaffoldSnippetView[];
}

function renderSnippetItem(item: ScaffoldSnippetView) {
    const lines = [
        `File ${item.path} contains this:`,
        '',
        '```',
        item.content,
        '```',
    ];
    return lines.join('\n');
}

export function renderScaffoldPrompt(view: ScaffoldView) {
    const description = dedent`
        Now you are going to write a **scaffold** code in file ${view.file}, a scaffold code strictly obeys these rules:

        - It should contains a section of code importing external modules
        - It could define some classes, fields, properties, functions, methods and constants, they should have well formed definition
        - It should not implement any concrete business logic inside functions and methods, leave them empty
        - It should contains code that are very very neccessary and important for this file, keep the code minimum

        You are asked to generate the code in 2 different parts:

        - An import section, which starts with "\`\`\`import" markdown syntax, keep all import statements inside it
        - A definition section, which starts with "\`\`\`definition" markdown syntax, keep code other than import statments here

        The content between \`<example>\` and \`</example>\` below illustrates how you should respond, keep your response format exactly the same and fill code into code blocks

        <example>
        Here are things to import:

        \`\`\`import
        ...
        \`\`\`

        Here are definitions in scaffold code:

        \`\`\`definition
        ...
        \`\`\`
        </example>

        If you are not confident enough, you can make both import and definition section empty, but you are required to output markdown code block even in this case, just keep the content inside code block empty.

        File ${view.file} is empty, generate the scaffold code now, do not generate any text out of example's guideline.
    `;
    const extension = path.extname(view.file);
    const sections = [
        `You are an experienced programmer in writing ${extension} files, you have created a file at {{file}}, here are several existing files for you to gather information:`,
        ...view.snippets.map(renderSnippetItem),
        description,
    ];
    return sections.join('\n\n');
}
