import {ExecutionRequest, Port} from '@otakustay/ipc';
import {getLanguageConfig} from '@oniichan/shared/language';
import {stringifyError} from '@oniichan/shared/string';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {Context, RequestHandler} from '../handler';
import {EnhancedContextSnippet, SemanticRewriteApi} from './api';

export interface SemanticRewriteRequest {
    documentUri: string;
    file: string;
    line: number;
}

interface SemanticRewriteTelemetryData {
    type: 'telemetryData';
    key: string;
    value: string;
}

interface SemanticRewriteAbort {
    type: 'abort';
    reason: string;
}

interface SemanticLoading {
    type: 'loading';
    visible: boolean;
}

interface SemanticRewriteResult {
    type: 'result';
    code: string;
}

export type SemanticRewriteResponse =
    | SemanticRewriteTelemetryData
    | SemanticRewriteAbort
    | SemanticRewriteResult
    | SemanticLoading;

interface GetContextFail {
    type: 'fail';
}

interface GetContextOk {
    type: 'ok';
    text: string;
    languageId: string;
}

interface EnhanceContextInput {
    documentUri: string;
    languageId: string;
    line: number;
    hint: string;
}

export class SemanticRewriteHandler extends RequestHandler<SemanticRewriteRequest, SemanticRewriteResponse> {
    static action = 'semanticRewrite' as const;

    private readonly api: SemanticRewriteApi;

    constructor(port: Port, request: ExecutionRequest, context: Context) {
        super(port, request, context);
        this.api = new SemanticRewriteApi(context.editorHost);
    }

    async *handleRequest(request: SemanticRewriteRequest): AsyncIterable<SemanticRewriteResponse> {
        const documentContext = await this.getDocumentContext(request.documentUri);

        if (documentContext.type !== 'ok') {
            yield {type: 'abort', reason: 'Editor not open'};
            return;
        }

        const {text, languageId} = documentContext;
        const lines = text.split('\n');
        const hint = lines.at(request.line)?.trim();

        if (!hint) {
            yield {type: 'abort', reason: 'Current line is empty'};
            return;
        }

        const language = getLanguageConfig(languageId);

        if (language.isComment(hint)) {
            yield {type: 'abort', reason: 'Current line is comment'};
            return;
        }

        const codeBefore = lines.slice(0, request.line).join('\n');
        const codeAfter = lines.slice(request.line + 1).join('\n');
        yield {type: 'telemetryData', key: 'inputCodeAfter', value: codeAfter};
        yield {type: 'telemetryData', key: 'inputCodeBefore', value: codeBefore};

        yield {type: 'loading', visible: true};

        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'semanticRewrite');
        try {
            const input: EnhanceContextInput = {
                documentUri: request.documentUri,
                line: request.line,
                languageId,
                hint,
            };
            const snippets = await this.retrieveEnhancedContext(input);
            const code = await this.api.rewrite(
                {
                    file: request.file,
                    codeBefore: codeBefore,
                    codeAfter: codeAfter,
                    hint: hint,
                    snippets,
                },
                telemetry
            );
            yield {type: 'telemetryData', key: 'outputCode', value: code};
            yield {type: 'result', code};
        }
        catch (ex) {
            throw new Error(`Semantic rewrite failed: ${stringifyError(ex)}`, {cause: ex});
        }
    }

    private async getDocumentContext(documentUri: string): Promise<GetContextOk | GetContextFail> {
        try {
            const document = this.context.editorHost.getDocument(documentUri);
            const [text, languageId] = await Promise.all([document.getText(), document.getLanguageId()]);

            return {
                type: 'ok',
                text,
                languageId,
            };
        }
        catch {
            return {type: 'fail'};
        }
    }

    private async retrieveEnhancedContext(input: EnhanceContextInput): Promise<EnhancedContextSnippet[]> {
        try {
            const document = this.context.editorHost.getDocument(input.documentUri);
            const language = getLanguageConfig(input.languageId);
            if (language.endsWithIdentifier(input.hint)) {
                return [];
            }

            const diagnostics = await document.getDiagnosticsAtLine(input.line);
            return [
                {
                    label: 'dianostics',
                    title: 'These are problems reported at cursor, you should also try to fix them.',
                    content: diagnostics.map(v => v.message).map(v => `- ${v}`).join('\n'),
                },
            ];
        }
        catch {
            return [];
        }
    }
}