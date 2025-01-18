import {assertNever} from '../error';
import {
    AssistantTextMessage,
    UserRequestMessage,
    Message,
    UserRequestMessagePersistData,
    AssistantTextMessagePersistData,
} from './message';
import {Workflow, WorkflowOriginMessage, WorkflowPersistData} from './workflow';

interface RoundtripMessageResponsePersistData {
    type: 'message';
    message: AssistantTextMessagePersistData;
}

interface RoundtripWorkflowResponsePersistData {
    type: 'workflow';
    workflow: WorkflowPersistData;
}

type RoundtripResponsePersistData = RoundtripMessageResponsePersistData | RoundtripWorkflowResponsePersistData;

export interface RoundtripPersistData {
    request: UserRequestMessagePersistData;
    responses: RoundtripResponsePersistData[];
}

interface RoundtripMessageResponse {
    type: 'message';
    message: AssistantTextMessage;
}

interface RoundtripWorkflowResponse {
    type: 'workflow';
    workflow: Workflow;
}

type RoundtripResponse = RoundtripMessageResponse | RoundtripWorkflowResponse;

/**
 * A roundtrip is a part of a thread that starts from a user submitted request,
 * then a bunch of messages are involed to handle this request, like tool calls and LLM text responses.
 */
export class Roundtrip {
    static from(data: RoundtripPersistData): Roundtrip {
        const request = UserRequestMessage.from(data.request);
        const roundtrip = new Roundtrip(request);
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

    constructor(request: UserRequestMessage) {
        this.request = request;
    }

    startTextResponse(messageUuid: string) {
        const response: RoundtripMessageResponse = {
            type: 'message',
            message: new AssistantTextMessage(messageUuid),
        };
        this.responses.push(response);
        return response.message;
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

    toMessages() {
        const messages: Message[] = [this.request];
        for (const response of this.responses) {
            if (response.type === 'message') {
                messages.push(response.message);
            }
            else if (response.type === 'workflow') {
                messages.push(...response.workflow.toMessages());
            }
        }
        return messages;
    }

    toPersistData(): RoundtripPersistData {
        const serializeResponse = (response: RoundtripResponse): RoundtripResponsePersistData => {
            if (response.type === 'message') {
                return {
                    type: response.type,
                    message: response.message.toPersistData(),
                };
            }
            else if (response.type === 'workflow') {
                return {
                    type: response.type,
                    workflow: response.workflow.toPersistData(),
                };
            }
            else {
                assertNever<{type: string}>(response, v => `Unknown roundtrip response type: ${v.type}`);
            }
        };
        return {
            request: this.request.toPersistData(),
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
