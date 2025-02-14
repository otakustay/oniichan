import {assertNever} from '@oniichan/shared/error';
import {
    DebugMessageLevel,
    DebugContentChunk,
    RoundtripData,
    RoundtripResponseData,
    RoundtripStatus,
} from '@oniichan/shared/inbox';
import {AssistantTextMessage, UserRequestMessage, Message, DebugMessage} from './message';
import {Workflow, WorkflowOriginMessage} from './workflow';

interface RoundtripMessageResponse {
    type: 'message';
    message: AssistantTextMessage;
}

interface RoundtripWorkflowResponse {
    type: 'workflow';
    workflow: Workflow;
}

interface RoundtripDebugResponse {
    type: 'debug';
    message: DebugMessage;
}

type RoundtripResponse = RoundtripMessageResponse | RoundtripWorkflowResponse | RoundtripDebugResponse;

/**
 * A roundtrip is a part of a thread that starts from a user submitted request,
 * then a bunch of messages are involed to handle this request, like tool calls and LLM text responses.
 */
export class Roundtrip {
    static from(data: RoundtripData): Roundtrip {
        const request = UserRequestMessage.from(data.request);
        const roundtrip = new Roundtrip(request);
        roundtrip.markStatus(data.status);
        for (const response of data.responses) {
            if (response.type === 'message') {
                const message = AssistantTextMessage.from(response.message);
                roundtrip.addTextResponse(message);
            }
            else if (response.type === 'workflow') {
                const workflow = Workflow.from(response.workflow);
                roundtrip.addWorkflowResponse(workflow);
            }
        }
        return roundtrip;
    }

    private readonly request: UserRequestMessage;

    private readonly responses: RoundtripResponse[] = [];

    private status: RoundtripStatus = 'running';

    constructor(request: UserRequestMessage) {
        this.request = request;
    }

    getRequestText() {
        return this.request.content;
    }

    getStatus() {
        return this.status;
    }

    markStatus(status: RoundtripStatus) {
        // A `generating` message can be marked as both `unread` or `read`,
        // a `unread` message can only be marked as `read`,
        // a `read` message cannot be marked as `running` nor `unread`
        if (this.status === 'running' || status === 'read') {
            this.status = status;
        }
    }

    startTextResponse(messageUuid: string) {
        const response: RoundtripMessageResponse = {
            type: 'message',
            message: new AssistantTextMessage(messageUuid),
        };
        this.responses.push(response);
        return response.message;
    }

    addDebugMessage(messageUuid: string, level: DebugMessageLevel, title: string, content: DebugContentChunk) {
        const response: RoundtripDebugResponse = {
            type: 'debug',
            message: new DebugMessage(messageUuid, level, title, content),
        };
        this.responses.push(response);
    }

    startWorkflowResponse(origin: WorkflowOriginMessage) {
        // Before converted to a workflow, we already have a message response in roundtrip
        const response = this.findMessageResponseStrict(origin.uuid);
        const responseIndex = this.responses.lastIndexOf(response);

        const workflowResponse: RoundtripWorkflowResponse = {
            type: 'workflow',
            workflow: new Workflow(origin),
        };
        this.responses[responseIndex] = workflowResponse;
        return workflowResponse.workflow;
    }

    hasMessage(messageUuid: string) {
        if (this.request.uuid === messageUuid) {
            return true;
        }
        for (const response of this.responses) {
            if (response.type === 'message' && response.message.uuid === messageUuid) {
                return true;
            }
            if (response.type === 'workflow' && response.workflow.hasMessage(messageUuid)) {
                return true;
            }
        }
        return false;
    }

    findMessageByUuid(messageUuid: string) {
        if (this.request.uuid === messageUuid) {
            return this.request;
        }

        for (const response of this.responses) {
            if (response.type === 'message' && response.message.uuid === messageUuid) {
                return response.message;
            }
            if (response.type === 'workflow') {
                const message = response.workflow.findMessage(messageUuid);
                if (message) {
                    return message;
                }
            }
        }

        return null;
    }

    getLatestTextMessageStrict(): AssistantTextMessage {
        const lastResponse = this.responses.at(-1);

        if (lastResponse?.type !== 'message') {
            throw new Error('Roundtrip does not have a latest message of type text');
        }

        return lastResponse.message;
    }

    addWarning(message: string) {
        this.request.setError(message);
    }

    toMessages(includingDebug = false) {
        const messages: Message[] = [this.request];
        for (const response of this.responses) {
            if (response.type === 'debug') {
                if (includingDebug) {
                    messages.push(response.message);
                }
            }
            else if (response.type === 'message') {
                messages.push(response.message);
            }
            else if (response.type === 'workflow') {
                messages.push(...response.workflow.toMessages());
            }
        }
        return messages;
    }

    toRoundtripData(): RoundtripData {
        const serializeResponse = (response: RoundtripResponse): RoundtripResponseData => {
            switch (response.type) {
                case 'debug':
                    return {
                        type: response.type,
                        message: response.message.toMessageData(),
                    };
                case 'message':
                    return {
                        type: response.type,
                        message: response.message.toMessageData(),
                    };
                case 'workflow':
                    return {
                        type: response.type,
                        workflow: response.workflow.toWorkflowData(),
                    };
                default:
                    assertNever<{type: string}>(response, v => `Unknown roundtrip response type: ${v.type}`);
            }
        };
        return {
            status: this.status,
            request: this.request.toMessageData(),
            responses: this.responses.map(serializeResponse),
        };
    }

    private addTextResponse(message: AssistantTextMessage) {
        const response: RoundtripMessageResponse = {
            type: 'message',
            message,
        };
        this.responses.push(response);
    }

    private addWorkflowResponse(workflow: Workflow) {
        const response: RoundtripWorkflowResponse = {
            type: 'workflow',
            workflow,
        };
        this.responses.push(response);
    }

    private findMessageResponseStrict(messageUuid: string): RoundtripMessageResponse {
        for (const response of this.responses) {
            if (response.type === 'message' && response.message.uuid === messageUuid) {
                return response;
            }
        }

        throw new Error(`Message ${messageUuid} not found`);
    }
}
