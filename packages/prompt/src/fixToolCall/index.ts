import type {ToolDescription} from '@oniichan/shared/tool';

export interface FixToolCallView {
    tool: ToolDescription;
    errorContent: string;
    errorMessage: string;
}

export function renderFixToolCallPrompt(view: FixToolCallView) {
    const lines = [
        'I\'m working on a task to create a XML structure but got a incorrect result, a correct XML always align with these rules:',
        '',
        '1. A root element is required.',
        '2. For each parameter, a child element is placed inside the root element with its tag name representing the parameter name.',
        '3. Parameter values are placed inside the corresponding child elements.',
        '',
        'This is an usage example of this tool:',
        '',
        view.tool.usage,
        '',
        'Here is a message including the thoughts and incorrect XML result:',
        '',
        '```',
        view.errorContent,
        '```',
        '',
        `The validation error message is: ${view.errorMessage}`,
        '',
        'Please correct the XML result and provide a valid one, directly output the expected XML without any markdown syntax',
    ];
    return lines.join('\n');
}
