import path from 'node:path';
import {ChatUserMessagePayload} from '@oniichan/shared/model';
import {renderPrompt} from '@oniichan/shared/prompt';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {EditorHost} from '../../editor';
import rewriteTemplate from './rewrite.prompt';

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
    private readonly taskId: string;

    private readonly editorHost: EditorHost;

    constructor(taskId: string, editorHost: EditorHost) {
        this.taskId = taskId;
        this.editorHost = editorHost;
    }

    async rewrite(paylod: SemanticRewritePayload, telemetry: FunctionUsageTelemetry): Promise<string> {
        const {file, codeBefore, codeAfter, hint, snippets} = paylod;
        const model = this.editorHost.getModelAccess(this.taskId);
        const prompt = renderPrompt(
            rewriteTemplate,
            {
                file,
                codeBefore,
                codeAfter,
                hint,
                snippets,
                extension: path.extname(file),
            }
        );
        const messages: ChatUserMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const modelTelemetry = telemetry.createModelTelemetry();
        const response = await model.chat({messages, telemetry: modelTelemetry});

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
