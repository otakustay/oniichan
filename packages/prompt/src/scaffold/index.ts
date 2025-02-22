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

        You are asked to generate the code in 2 different xml tags:

        - A <import> tag, keep all import statements inside it
        - A <definition> tag, keep code other than import statments here

        The code block below is an example illustrates how you should respond, keep your response format exactly the same and fill code into XML tags

        \`\`\`
        <import>
        all import statements here
        </import>

        <definition>
        definition scaffold code here
        </definition>
        \`\`\`

        If you are not confident enough, you can make one or both import and definition tag empty, but the XML tag itself is still required, just keep the content inside XML tag empty.

        File ${view.file} is empty, generate the scaffold code now, do not generate any text out of example's guideline.
    `;
    const extension = path.extname(view.file);
    const sections = [
        `You are an experienced programmer in writing ${extension} files, you have created a file at ${view.file}, here are several existing files for you to gather information:`,
        ...view.snippets.map(renderSnippetItem),
        description,
    ];
    return sections.join('\n\n');
}
