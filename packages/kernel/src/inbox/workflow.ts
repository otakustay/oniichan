import {WorkflowData, WorkflowStatus} from '@oniichan/shared/inbox';
import {AssistantTextMessage, deserializeMessage, Message, ToolCallMessage} from './message';
import {InboxRoundtrip} from './interface';

export type WorkflowOriginMessage = ToolCallMessage;

export class Workflow {
    static from(data: WorkflowData, roundtrip: InboxRoundtrip): Workflow {
        const workflow = new Workflow(ToolCallMessage.from(data.origin, roundtrip), roundtrip);
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

    private readonly origin: WorkflowOriginMessage;

    private readonly roundtrip: InboxRoundtrip;

    private readonly reactions: Message[] = [];

    private readonly exposed: string[] = [];

    constructor(origin: WorkflowOriginMessage, roundtrip: InboxRoundtrip) {
        this.origin = origin;
        this.roundtrip = roundtrip;
    }

    getOriginMessage() {
        return this.origin;
    }

    shouldContinueRoundtrip() {
        return this.continueRoundtrip;
    }

    setContinueRoundtrip(shouldContinue: boolean) {
        this.continueRoundtrip = shouldContinue;
    }

    startReaction(uuid: string) {
        const message = new AssistantTextMessage(uuid, this.roundtrip);
        this.reactions.push(message);
        return message;
    }

    exposeMessage(messageUuid: string) {
        const message = this.findMessageStrict(messageUuid);
        this.exposed.push(message.uuid);
    }

    addReaction(message: Message, exposed: boolean) {
        this.reactions.push(message);
        if (exposed) {
            this.exposed.push(message.uuid);
        }
    }

    isOriginatedBy(uuid: string) {
        return this.origin.uuid === uuid;
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

        if (!message) {
            throw new Error(`Message ${messageUuid} not found in workflow`);
        }

        return message;
    }
}
