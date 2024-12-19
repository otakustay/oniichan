import path from 'node:path';
import {ChatMessagePayload} from '@oniichan/shared/model';
import {renderPrompt} from '@oniichan/shared/prompt';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {EditorHost} from '../../host';
import scaffoldTemplate from './scaffold.prompt';

export interface ScaffoldSnippet {
    path: string;
    content: string;
}

interface ScaffoldPayload {
    file: string;
    snippets: ScaffoldSnippet[];
}

interface ScaffoldResult {
    section: 'import' | 'definition';
    code: string;
}

export class ScaffoldApi {
    private readonly taskId: string;

    private readonly editorHost: EditorHost;

    constructor(taskId: string, editorHost: EditorHost) {
        this.taskId = taskId;
        this.editorHost = editorHost;
    }

    async *generate(paylod: ScaffoldPayload, telemetry: FunctionUsageTelemetry): AsyncIterable<ScaffoldResult> {
        const {file, snippets} = paylod;
        const model = this.editorHost.getModelAccess(this.taskId);
        const prompt = renderPrompt(
            scaffoldTemplate,
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
        for await (const chunk of model.codeStreaming(messages, modelTelemetry)) {
            if (chunk.tag === 'import') {
                yield {
                    section: 'import',
                    code: chunk.content,
                };
            }
            else if (chunk.tag === 'definition') {
                yield {
                    section: 'definition',
                    code: chunk.content,
                };
            }
        }
    }
}
