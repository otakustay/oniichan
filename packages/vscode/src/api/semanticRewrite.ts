import path from 'node:path';
import {ChatMessagePayload} from '@oniichan/shared/model';
import {renderPrompt} from '@oniichan/shared/prompt';
import {recordFunctionUsage} from '@oniichan/storage/telemetry';
import {createModelAccess} from './model';
import rewriteTemplate from './rewrite.prompt';

export default {
    rewrite: async (file: string, codeBefore: string, codeAfter: string, hint: string): Promise<string> => {
        const startTime = (new Date()).toISOString();
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
        const messages: ChatMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const [text, meta] = await model.chat(messages);

        const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
        const codeBlocks = text.match(codeBlockRegex);
        const code = codeBlocks
            ? codeBlocks.map(block => block.replace(/```(?:\w+\n)?|```/g, '')).join('\n')
            : text;

        const endTime = (new Date()).toISOString();
        void recordFunctionUsage(
            {
                startTime,
                endTime,
                file,
                function: 'semanticRewrite',
                inputCodeBefore: codeBefore,
                inputCodeAfter: codeAfter,
                inputHint: hint,
                outputCode: code,
            },
            {
                model: meta.model,
                input: prompt,
                output: text,
                inputTokens: meta.usage.inputTokens,
                outputTokens: meta.usage.outputTokens,
            }
        );

        return code;
    },
};
