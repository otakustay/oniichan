import {ChatUserMessagePayload} from '@oniichan/shared/model';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {renderSemanticRewritePrompt, SemanticRewriteView} from '@oniichan/prompt';
import {ModelAccessHost} from '../../core/model';

export interface EnhancedContextSnippet {
    label: string;
    title: string;
    content: string;
}

export interface SemanticRewritePayload {
    file: string;
    codeBefore: string;
    codeAfter: string;
    hint: string;
    snippets: EnhancedContextSnippet[];
}

export class SemanticRewriteApi {
    private readonly modelAccess: ModelAccessHost;

    constructor(modelAccess: ModelAccessHost) {
        this.modelAccess = modelAccess;
    }

    async rewrite(paylod: SemanticRewritePayload, telemetry: FunctionUsageTelemetry): Promise<string> {
        const {file, codeBefore, codeAfter, hint, snippets} = paylod;
        const view: SemanticRewriteView = {
            file,
            codeBefore,
            codeAfter,
            hint,
            snippets,
        };
        const prompt = renderSemanticRewritePrompt(view);
        const messages: ChatUserMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const modelTelemetry = telemetry.createModelTelemetry();
        const response = await this.modelAccess.chat({messages, telemetry: modelTelemetry});

        if (response.type === 'text') {
            const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
            const codeBlocks = response.content.match(codeBlockRegex);
            const code = codeBlocks
                ? codeBlocks.map(block => block.replace(/```(?:\w+\n)?|```/g, '')).join('\n')
                : response.content;
            return code;
        }
        return '';
    }
}
