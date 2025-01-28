import {
    AssistantTextMessage,
    deserializeMessage,
    Message,
    MessagePersistData,
    ToolCallMessage,
    ToolCallMessagePersistData,
} from './message';

export type WorkflowStatus = 'running' | 'completed' | 'failed';

export type WorkflowOriginMessage = ToolCallMessage;

export type WorkflowOriginMessagePersistData = ToolCallMessagePersistData;

export interface WorkflowPersistData {
    status: WorkflowStatus;
    origin: WorkflowOriginMessagePersistData;
    reactions: MessagePersistData[];
    exposed: string[];
}

export class Workflow {
    static from(data: WorkflowPersistData): Workflow {
        const workflow = new Workflow(ToolCallMessage.from(data.origin));
        workflow.markStatus(data.status);
        for (const reaction of data.reactions) {
            workflow.addReaction(deserializeMessage(reaction), false);
        }
        for (const uuid of data.exposed) {
            workflow.exposeMessage(uuid);
        }
        return workflow;
    }

    private status: WorkflowStatus = 'running';

    private readonly origin: WorkflowOriginMessage;

    private readonly reactions: Message[] = [];

    private readonly exposed: string[] = [];

    constructor(origin: WorkflowOriginMessage) {
        this.origin = origin;
    }

    startReaction(uuid: string) {
        const message = new AssistantTextMessage(uuid);
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

    toPersistData(): WorkflowPersistData {
        return {
            status: this.status,
            origin: this.origin.toPersistData(),
            reactions: this.reactions.map(v => v.toPersistData()).filter(v => !!v),
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
