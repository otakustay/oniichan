import {ChatUserMessagePayload} from '@oniichan/shared/model';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {renderScaffoldPrompt} from '@oniichan/prompt';
import {ModelAccessHost} from '../../core/model';

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
    private readonly modelAccess: ModelAccessHost;

    constructor(modelAccess: ModelAccessHost) {
        this.modelAccess = modelAccess;
    }

    async *generate(paylod: ScaffoldPayload, telemetry: FunctionUsageTelemetry): AsyncIterable<ScaffoldResult> {
        const {file, snippets} = paylod;
        const prompt = renderScaffoldPrompt({file, snippets});
        const messages: ChatUserMessagePayload[] = [
            {role: 'user', content: prompt},
        ];
        const modelTelemetry = telemetry.createModelTelemetry();
        for await (const chunk of this.modelAccess.codeStreaming({messages, telemetry: modelTelemetry})) {
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
