import path from 'node:path';
import {ChatMessagePayload} from '@oniichan/shared/model';
import {renderPrompt} from '@oniichan/shared/prompt';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {EditorHost} from '../../host';
import rewriteTemplate from './scaffold.prompt';

export interface ScaffoldSnippet {
    path: string;
    content: string;
}

interface ScaffoldPayload {
    file: string;
    snippets: ScaffoldSnippet[];
}

interface ScaffoldResult {
    importSection: string;
    definitionSection: string;
}

export class ScaffoldApi {
    private readonly taskId: string;

    private readonly editorHost: EditorHost;

    constructor(taskId: string, editorHost: EditorHost) {
        this.taskId = taskId;
        this.editorHost = editorHost;
    }

    async generate(paylod: ScaffoldPayload, telemetry: FunctionUsageTelemetry): Promise<ScaffoldResult> {
        const {file, snippets} = paylod;
        const model = this.editorHost.getModelAccess(this.taskId);
        const prompt = renderPrompt(
            rewriteTemplate,
            {
                file,
                snippets,
                extension: path.extname(file),
            }
        );
        const messages: ChatMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const modelTelemetry = telemetry.createModelTelemetry();
        const text = await model.chat(messages, modelTelemetry);
        return {
            importSection: this.extractCodeBlock(text, 'import'),
            definitionSection: this.extractCodeBlock(text, 'definition'),
        };
    }

    private extractCodeBlock(text: string, tag: string) {
        const start = text.indexOf('```' + tag);

        if (start < 0) {
            return '';
        }

        const end = text.indexOf('```', start + 3 + tag.length);
        return text.slice(start + 3 + tag.length, end < 0 ? text.length : end).trim();
    }
}
