import {assertHasValue, assertNever} from '@oniichan/shared/error';
import type {
    AssistantRole,
    ParsedToolCallMessageChunkOf,
    RoundtripData,
    RoundtripMessageData,
    RoundtripResponseData,
    RoundtripStatus,
} from '@oniichan/shared/inbox';
import type {ToolName} from '@oniichan/shared/tool';
import {AssistantTextMessage, UserRequestMessage} from './message';
import {Workflow} from './workflow';
import type {
    InboxAssistantTextMessage,
    InboxMessage,
    InboxRoundtrip,
    InboxToolCallMessage,
    InboxWorkflow,
    InboxWorkflowOriginMessage,
} from './interface';
import {isAssistantMessage, isToolCallMessageOf} from './assert';

interface RoundtripMessageResponse {
    type: 'message';
    message: InboxAssistantTextMessage;
}

interface RoundtripWorkflowResponse {
    type: 'workflow';
    workflow: InboxWorkflow;
}

type RoundtripResponse = RoundtripMessageResponse | RoundtripWorkflowResponse;

/**
 * A roundtrip is a part of a thread that starts from a user submitted request,
 * then a bunch of messages are involed to handle this request, like tool calls and LLM text responses.
 */
export class Roundtrip implements InboxRoundtrip {
    static from(data: RoundtripData): Roundtrip {
        const roundtrip = new Roundtrip();
        const request = UserRequestMessage.from(data.request, roundtrip);
        roundtrip.setRequest(request);
        roundtrip.markStatus(data.status);
        for (const response of data.responses) {
            if (response.type === 'message') {
                const message = AssistantTextMessage.from(response.message, roundtrip);
                roundtrip.addTextResponse(message);
            }
            else if (response.type === 'workflow') {
                const workflow = Workflow.from(response.workflow, roundtrip);
                roundtrip.addWorkflowResponse(workflow);
            }
        }
        return roundtrip;
    }

    private request: UserRequestMessage | null = null;

    private readonly responses: RoundtripResponse[] = [];

    private status: RoundtripStatus = 'running';

    setRequest(request: UserRequestMessage) {
        this.request = request;
    }

    getRequestText() {
        return this.getRequest().content;
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

    startTextResponse(messageUuid: string, role: AssistantRole) {
        const response: RoundtripMessageResponse = {
            type: 'message',
            message: new AssistantTextMessage(messageUuid, role, this),
        };
        this.responses.push(response);
        return response.message;
    }

    startWorkflowResponse(origin: InboxWorkflowOriginMessage) {
        // Before converted to a workflow, we already have a message response in roundtrip
        const response = this.findMessageResponseStrict(origin.uuid);
        const responseIndex = this.responses.lastIndexOf(response);

        const workflowResponse: RoundtripWorkflowResponse = {
            type: 'workflow',
            workflow: new Workflow(origin, this),
        };
        this.responses[responseIndex] = workflowResponse;
        return workflowResponse.workflow;
    }

    hasMessage(messageUuid: string) {
        if (this.getRequest().uuid === messageUuid) {
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
        const request = this.getRequest();
        if (request.uuid === messageUuid) {
            return request;
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
    getLatestTextMessage(): InboxAssistantTextMessage | null {
        const lastResponse = this.responses.at(-1);
        return lastResponse?.type === 'message' ? lastResponse.message : null;
    }

    getLatestTextMessageStrict(): InboxAssistantTextMessage {
        const message = this.getLatestTextMessage();
        assertHasValue(message, 'Roundtrip does not have a latest response of type text');
        return message;
    }

    getLatestWorkflow(): InboxWorkflow | null {
        const lastResponse = this.responses.at(-1);
        return lastResponse?.type === 'workflow' ? lastResponse.workflow : null;
    }

    getLatestWorkflowStrict(): InboxWorkflow {
        const workflow = this.getLatestWorkflow();
        assertHasValue(workflow, 'Roundtrip does not have a latest response of type workflow');
        return workflow;
    }

    addWarning(message: string) {
        this.getRequest().setError(message);
    }

    findLastToolCallMessageByToolNameStrict<N extends ToolName>(toolName: N): InboxToolCallMessage<N> {
        const responses = this.getResponseMessages();
        const message = responses.findLast(v => isToolCallMessageOf(v, toolName));
        assertHasValue(message, `Roundtrip does not have a message containing tool call of ${toolName}`);
        return message;
    }

    findLastToolCallChunkByToolNameStrict<N extends ToolName>(toolName: N): ParsedToolCallMessageChunkOf<N> {
        const message = this.findLastToolCallMessageByToolNameStrict(toolName);
        const chunk = message.findToolCallChunkStrict();
        return chunk;
    }

    toMessages() {
        return [
            this.getRequest(),
            ...this.getResponseMessages(),
        ];
    }

    toRoundtripData(): RoundtripData {
        const serializeResponse = (response: RoundtripResponse): RoundtripResponseData => {
            switch (response.type) {
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
            request: this.getRequest().toMessageData(),
            responses: this.responses.map(serializeResponse),
        };
    }

    toRoundtripMessageData(): RoundtripMessageData {
        return {
            status: this.getStatus(),
            request: this.getRequest().toMessageData(),
            responses: this.getResponseMessages().filter(isAssistantMessage).map(v => v.toMessageData()),
        };
    }

    private getRequest() {
        if (!this.request) {
            throw new Error('Roundtrip is not initialized with a request');
        }

        return this.request;
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

    private getResponseMessages(): InboxMessage[] {
        const convert = (response: RoundtripResponse): InboxMessage | InboxMessage[] => {
            if (response.type === 'message') {
                return response.message;
            }
            else {
                return response.workflow.toMessages();
            }
        };
        return this.responses.flatMap(convert);
    }
}
