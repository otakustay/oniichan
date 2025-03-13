import type {ChatUserMessagePayload} from '@oniichan/shared/model';
import type {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {renderScaffoldPrompt} from '@oniichan/prompt';
import {over} from '@otakustay/async-iterator';
import {ModelAccessHost} from '../../core/model';
import type {EditorHost} from '../../core/editor';
import {consumeModelResponse} from './parse';
import type {ParsedChunk} from './parse';

export interface ScaffoldSnippet {
    path: string;
    content: string;
}

interface ScaffoldPayload {
    file: string;
    snippets: ScaffoldSnippet[];
}

export class ScaffoldApi {
    private readonly modelAccess: ModelAccessHost;

    constructor(editorHost: EditorHost) {
        this.modelAccess = new ModelAccessHost(editorHost);
    }

    async *generate(payload: ScaffoldPayload, telemetry: FunctionUsageTelemetry): AsyncIterable<ParsedChunk> {
        const {file, snippets} = payload;
        const prompt = renderScaffoldPrompt({file, snippets});
        const messages: ChatUserMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const modelTelemetry = telemetry.createModelTelemetry();
        const stream = this.modelAccess.chatStreaming({messages, telemetry: modelTelemetry});
        const textStream = over(stream).filter(v => v.type === 'text').map(v => v.content);
        yield* consumeModelResponse(textStream);
    }
}
