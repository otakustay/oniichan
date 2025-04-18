import type {WorkflowData, WorkflowStatus} from '@oniichan/shared/inbox';
import {assertHasValue} from '@oniichan/shared/error';
import {deserializeMessage, ToolCallMessage} from './message';
import type {AssistantTextMessage} from './message';
import type {InboxMessage, InboxRoundtrip, InboxWorkflow, InboxWorkflowOriginMessage} from './interface';

export type WorkflowOriginMessage = AssistantTextMessage | ToolCallMessage;

export class Workflow implements InboxWorkflow {
    static from(data: WorkflowData, roundtrip: InboxRoundtrip): Workflow {
        const origin = ToolCallMessage.from(data.origin, roundtrip);
        const workflow = new Workflow(origin, roundtrip);
        workflow.markStatus(data.status);
        for (const reaction of data.reactions) {
            workflow.addReaction(deserializeMessage(reaction, roundtrip), false);
        }
        for (const uuid of data.exposed) {
            workflow.exposeMessage(uuid);
        }
        return workflow;
    }

    private status: WorkflowStatus = 'running';

    private continueRoundtrip = false;

    private readonly origin: InboxWorkflowOriginMessage;

    private readonly roundtrip: InboxRoundtrip;

    private readonly reactions: InboxMessage[] = [];

    private readonly exposed: string[] = [];

    constructor(origin: InboxWorkflowOriginMessage, roundtrip: InboxRoundtrip) {
        this.origin = origin;
        this.roundtrip = roundtrip;
    }

    getStatus() {
        return this.status;
    }

    getOriginMessage() {
        return this.origin;
    }

    shouldContinueRoundtrip() {
        return this.status === 'completed' && this.continueRoundtrip;
    }

    setContinueRoundtrip(shouldContinue: boolean) {
        this.continueRoundtrip = shouldContinue;
    }

    exposeMessage(messageUuid: string) {
        const message = this.findMessageStrict(messageUuid);
        this.exposed.push(message.uuid);
    }

    addReaction(message: InboxMessage, exposed: boolean) {
        this.reactions.push(message);
        if (exposed) {
            this.exposed.push(message.uuid);
        }
    }

    hasMessage(messageUuid: string) {
        if (this.origin.uuid === messageUuid) {
            return true;
        }
        return this.reactions.some(v => v.uuid === messageUuid);
    }

    findMessage(messageUuid: string) {
        if (this.origin.uuid === messageUuid) {
            return this.origin;
        }

        const message = this.reactions.find(v => v.uuid === messageUuid);
        return message ?? null;
    }

    markStatus(status: WorkflowStatus) {
        this.status = status;
    }

    toMessages() {
        return [
            this.origin,
            ...this.reactions.filter(v => this.exposed.includes(v.uuid)),
        ];
    }

    toWorkflowData(): WorkflowData {
        return {
            status: this.status,
            origin: this.origin.toMessageData(),
            reactions: this.reactions.map(v => v.toMessageData()),
            exposed: this.exposed,
        };
    }

    private findMessageStrict(messageUuid: string) {
        const message = this.findMessage(messageUuid);
        assertHasValue(message, `Message ${messageUuid} not found in workflow`);
        return message;
    }
}
