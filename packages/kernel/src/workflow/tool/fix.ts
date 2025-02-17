import {builtinTools, StreamingToolParser} from '@oniichan/shared/tool';
import {FixToolCallView, renderFixToolCallPrompt} from '@oniichan/prompt';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {EditorHost, ModelAccessHost, ModelChatOptions} from '../../editor';
import {AssistantTextMessage, ToolCallMessage} from '../../inbox';
import {ToolInputError} from './utils';
import {newUuid} from '@oniichan/shared/id';

async function* iterable(content: string): AsyncIterable<string> {
    yield content;
}

function formatErrorMessage(error: ToolInputError) {
    switch (error.type) {
        case 'parameterMissing':
            return `Missing value for required parameter "${error.parameter}", this may be caused by empty content in <${error.parameter}> tag or missing <${error.parameter}> tag.`;
        case 'parameterType':
            return `Parameter "${error.parameter}" is not of type ${error.expectedType}.`;
        default:
            return `Parameters have unknown error: ${error.message}.`;
    }
}

export interface ToolCallMessageParserInit {
    editorHost: EditorHost;
    message: ToolCallMessage;
}

export class ToolCallMessageParser {
    private readonly editorHost: EditorHost;

    private readonly message: ToolCallMessage;

    constructor(init: ToolCallMessageParserInit) {
        this.editorHost = init.editorHost;
        this.message = init.message;
    }

    async parseToolMessage(content: string) {
        const parser = new StreamingToolParser();
        const message = new AssistantTextMessage(newUuid(), this.message.getRoundtrip());
        for await (const chunk of parser.parse(iterable(content))) {
            message.addChunk(chunk);
        }
        const toolCall = await message.toToolCallMessage(this.editorHost);

        if (!toolCall) {
            throw new Error('No tool call found in response');
        }

        return toolCall.getToolCallInputWithSource() ?? null;
    }
}

export interface ToolCallFixerInit {
    editorHost: EditorHost;
    model: ModelAccessHost;
    telemetry: FunctionUsageTelemetry;
    message: ToolCallMessage;
    error: ToolInputError;
}

export class ToolCallFixer {
    private readonly model: ModelAccessHost;

    private readonly telemetry: FunctionUsageTelemetry;

    private readonly message: ToolCallMessage;

    private readonly error: ToolInputError;

    private readonly parser: ToolCallMessageParser;

    constructor(init: ToolCallFixerInit) {
        this.model = init.model;
        this.telemetry = init.telemetry;
        this.message = init.message;
        this.error = init.error;
        this.parser = new ToolCallMessageParser({editorHost: init.editorHost, message: init.message});
    }

    async fixToolCall() {
        const input = this.message.getToolCallInput();
        const tool = builtinTools.find(v => v.name === input.name);

        if (!tool) {
            throw new Error('Cannot fix tool call without a determined tool name');
        }

        const view: FixToolCallView = {
            tool,
            errorContent: this.message.getTextContent(),
            errorMessage: formatErrorMessage(this.error),
        };
        const {default: pRetry} = await import('p-retry');
        const result = await pRetry(
            () => this.fix(view),
            {retries: 3}
        );

        return result;
    }

    private async fix(view: FixToolCallView) {
        const prompt = renderFixToolCallPrompt(view);
        const chatOptions: ModelChatOptions = {
            messages: [
                {role: 'user', content: prompt},
            ],
            telemetry: this.telemetry.createModelTelemetry(),
        };
        const result = await this.model.chat(chatOptions);
        const toolCall = await this.parser.parseToolMessage(result.content);
        return toolCall;
    }
}
