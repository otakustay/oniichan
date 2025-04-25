import type {InboxMessageResponse} from '@oniichan/kernel/protocol';
import {stringifyError} from '@oniichan/shared/error';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import type {ToolName} from '@oniichan/shared/tool';

function asString(value: RawToolCallParameter): string {
    return Array.isArray(value) ? value.join('\n') : (value ?? '');
}

function asArray(value: RawToolCallParameter): string[] {
    return Array.isArray(value) ? value : (value ? [value] : []);
}

function maxLength(value: string) {
    return value.length > 40 ? value.slice(0, 25) + '...' + value.slice(-15) : value;
}

function stringifyToolCallParameters(name: ToolName, parameters: Record<string, RawToolCallParameter>) {
    switch (name) {
        case 'ask_followup_question':
        case 'attempt_completion':
        case 'complete_task':
        case 'semantic_edit_code':
            return '';
        case 'browser_preview':
            return asString(parameters.url);
        case 'create_plan':
            return (asArray(parameters.read).length + asArray(parameters.coding).length).toString();
        case 'delete_file':
            return asString(parameters.path);
        case 'find_files_by_glob':
            return asString(parameters.glob);
        case 'find_files_by_regex':
            return asString(parameters.regex);
        case 'patch_file':
            return asString(parameters.path);
        case 'read_directory':
            return asString(parameters.path);
        case 'read_file':
            return asString(parameters.path);
        case 'write_file':
            return asString(parameters.path);
        case 'run_command':
            return asString(parameters.command);
        default:
            return '';
    }
}

interface ChunkStreamState {
    messages: Set<string>;
    toolName: ToolName | '';
    toolParameters: Record<string, RawToolCallParameter>;
}

interface ConsumeResult {
    status: 'spinning' | 'fail' | 'success';
    label: string;
}

export async function* consumeChunkStream(stream: AsyncIterable<InboxMessageResponse>): AsyncIterable<ConsumeResult> {
    const state: ChunkStreamState = {
        messages: new Set<string>(),
        toolName: '',
        toolParameters: {},
    };

    try {
        for await (const chunk of stream) {
            state.messages.add(chunk.replyUuid);

            if (chunk.value.type === 'toolStart') {
                state.toolName = chunk.value.toolName;
                state.toolParameters = {};
                yield {status: 'spinning', label: chunk.value.toolName};
            }
            else if (chunk.value.type === 'toolParameterStart' && state.toolName) {
                const parameterName = chunk.value.parameter;
                const parameterValue = state.toolParameters[parameterName];
                if (parameterValue === undefined) {
                    state.toolParameters[parameterName] = '';
                }
                else if (typeof parameterValue === 'string') {
                    state.toolParameters[parameterName] = [parameterValue, ''];
                }
                else {
                    parameterValue.push('');
                }
            }
            else if (chunk.value.type === 'toolDelta' && state.toolName) {
                for (const [key, value] of Object.entries(chunk.value.arguments)) {
                    const parameterValue = state.toolParameters[key];
                    if (parameterValue === undefined) {
                        state.toolParameters[key] = value;
                    }
                    else if (typeof parameterValue === 'string') {
                        state.toolParameters[key] = parameterValue + value;
                    }
                    else {
                        parameterValue[parameterValue.length - 1] += value;
                    }
                }

                const parameters = stringifyToolCallParameters(state.toolName, state.toolParameters);
                yield {
                    status: 'spinning',
                    label: parameters ? `${state.toolName} ${maxLength(parameters)}` : state.toolName,
                };
            }
            else if (chunk.value.type === 'toolEnd' && state.toolName) {
                const parameters = stringifyToolCallParameters(state.toolName, state.toolParameters);
                yield {
                    status: 'spinning',
                    label: parameters ? `${state.toolName} ${maxLength(parameters)}` : state.toolName,
                };
            }
        }
    }
    catch (ex) {
        yield {
            status: 'fail',
            label: maxLength(stringifyError(ex)),
        };
    }

    yield {
        status: 'success',
        label: `${state.messages.size} messages`,
    };
}
