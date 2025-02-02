import {builtinTools, ModelToolCallInput, StreamingToolParser} from '@oniichan/shared/tool';
import {FixToolCallView, renderFixToolCallPrompt} from '@oniichan/prompt';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {ModelAccessHost, ModelChatOptions} from '../../editor';
import {ToolInputError} from './utils';
import {newUuid} from '@oniichan/shared/id';
import {AssistantTextMessage} from '@oniichan/shared/inbox';

async function* iterable(content: string): AsyncIterable<string> {
    yield content;
}

export async function parseToolMessage(content: string) {
    const parser = new StreamingToolParser();
    const message = new AssistantTextMessage(newUuid());
    for await (const chunk of parser.parse(iterable(content))) {
        message.addChunk(chunk);
    }
    const toolCall = message.toToolCallMessage();

    if (!toolCall) {
        throw new Error('No tool call found in response');
    }

    return toolCall.getToolCallInputWithSource() ?? null;
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

interface FixOptions {
    model: ModelAccessHost;
    telemetry: FunctionUsageTelemetry;
}

async function fix(view: FixToolCallView, options: FixOptions) {
    const {model, telemetry} = options;
    const prompt = renderFixToolCallPrompt(view);
    const chatOptions: ModelChatOptions = {
        messages: [
            {role: 'user', content: prompt},
        ],
        telemetry: telemetry.createModelTelemetry(newUuid()),
    };
    const result = await model.chat(chatOptions);
    const toolCall = await parseToolMessage(result.content);
    return toolCall;
}

export interface ToolCallFixOptions extends FixOptions {
    input: ModelToolCallInput;
    response: string;
    error: ToolInputError;
}

export async function fixToolCall(options: ToolCallFixOptions) {
    const {input, response, error, model, telemetry} = options;
    const tool = builtinTools.find(v => v.name === input.name);

    if (!tool) {
        throw new Error('Cannot fix tool call without a determined tool name');
    }

    const view: FixToolCallView = {
        tool,
        errorContent: response,
        errorMessage: formatErrorMessage(error),
    };
    const {default: pRetry} = await import('p-retry');
    const result = await pRetry(
        () => fix(view, {model, telemetry}),
        {retries: 3}
    );

    // TODO: If this still errors a lot, try to fix by providing all previous messages with prompt from Cline.
    return result;
}
