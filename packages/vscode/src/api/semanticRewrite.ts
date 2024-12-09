import path from 'node:path';
import {ChatMessagePayload} from '@oniichan/shared/model';
import {renderPrompt} from '@oniichan/shared/prompt';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {createModelAccess} from './model';
import rewriteTemplate from './rewrite.prompt';

export interface SemanticRewritePayload {
    file: string;
    codeBefore: string;
    codeAfter: string;
    hint: string;
}

export default {
    rewrite: async (paylod: SemanticRewritePayload, telemetry: FunctionUsageTelemetry): Promise<string> => {
        const {file, codeBefore, codeAfter, hint} = paylod;
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
        const modelTelemetry = telemetry.createModelTelemetry();
        const text = await model.chat(messages, modelTelemetry);

        const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
        const codeBlocks = text.match(codeBlockRegex);
        const code = codeBlocks
            ? codeBlocks.map(block => block.replace(/```(?:\w+\n)?|```/g, '')).join('\n')
            : text;
        return code;
    },
};
