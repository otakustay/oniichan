import {ChatUserMessagePayload} from '@oniichan/shared/model';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {renderScaffoldPrompt} from '@oniichan/prompt';
import {ModelAccessHost} from '../../core/model';
import {consumeModelResponse, ParsedChunk} from './parse';
import {over} from '@otakustay/async-iterator';

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

    constructor(modelAccess: ModelAccessHost) {
        this.modelAccess = modelAccess;
    }

    async *generate(paylod: ScaffoldPayload, telemetry: FunctionUsageTelemetry): AsyncIterable<ParsedChunk> {
        const {file, snippets} = paylod;
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
