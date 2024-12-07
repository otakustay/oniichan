import path from 'node:path';
import {ChatMessagePayload} from '@oniichan/shared/model';
import {renderPrompt} from '@oniichan/shared/prompt';
import {createModelAccess} from './model';
import rewriteTemplate from './rewrite.prompt';

export default {
    rewrite: async (file: string, codeBefore: string, codeAfter: string, hint: string): Promise<string> => {
        const model = await createModelAccess();
        const prompt = renderPrompt(
            rewriteTemplate,
            {
                file,
                codeBefore,
                codeAfter,
                hint,
                extension: path.extname(file),
            }
        );
        console.log(prompt);
        const messages: ChatMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const text = await model.chat(messages);

        const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
        const codeBlocks = text.match(codeBlockRegex);
        if (codeBlocks) {
            return codeBlocks.map(block => block.replace(/```(?:\w+\n)?|```/g, '')).join('\n');
        }
        return text;
    },
};
