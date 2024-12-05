import path from 'node:path';
import dedent from 'dedent';
import {chat, ChatMessagePayload} from './model';

function createPrompt(file: string, codeBefore: string, codeAfter: string, hint: string) {
    const before = codeBefore.trim()
        ? `Here is code before cursor：\n\n\`\`\`\n${codeBefore}\n\`\`\``
        : 'There is no code before cursor';
    const after = codeAfter.trim()
        ? `Here is code after cursor：\n\n\`\`\`\n${codeAfter}\n\`\`\``
        : 'There is no code after cursor';
    return dedent`
        You are a programming expert on ${path.extname(file)} files, now you will receive these inputs from editor:

        1. The file path in project
        2. A block of code before the cursor
        3. A block of code after the cursor
        4. A pseudo-code as a hint for the code to be generated at the cursor position

        Current file path is \`${file}\`

        ${before}

        ${after}

        The pseudo-code for the code to be generated at the cursor position is as follows:

        \`\`\`
        ${hint}
        \`\`\`

        Please note it is possible that some part of the code before or after cursor is also pseudo-code, you need to judge its effect or ignore this part.

        You should generate the final code to be inserted at the cursor position according to this pseudo-code, and meet the following requirements:

        1. Must follow the syntax of \`${path.extname(file)}\` file
        2. The generated code should be a complete logic when combined with the code before and after the cursor
        3. The generated code should only express the logic of the current pseudo-code, do not guess or add any logic in addition
        4. If the pseudo-code given above is already a syntax that is legal in the context of current file, then return this part directly without making any changes
        5. Pay attention to the indentation of the code before and after the cursor, each line of your generated code must be prefixed with correct indentation
        6. Only return the generated code, do not output any markdown text
    `;
}

export default {
    rewrite: async (file: string, codeBefore: string, codeAfter: string, hint: string): Promise<string> => {
        const prompt = createPrompt(file, codeBefore, codeAfter, hint);
        const messages: ChatMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const text = await chat(messages);

        const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
        const codeBlocks = text.match(codeBlockRegex);
        if (codeBlocks) {
            return codeBlocks.map(block => block.replace(/```(?:\w+\n)?|```/g, '')).join('\n');
        }
        return text;
    },
};
