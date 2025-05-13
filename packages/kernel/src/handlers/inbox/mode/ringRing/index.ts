import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../../../inbox';
import {ChatCapabilityProvider} from '../base/provider';
import type {ChatRole} from '../base/provider';

class RingRingPlannerRole implements ChatRole {
    private readonly plannerModelName: string;

    constructor(plannerModelName: string) {
        this.plannerModelName = plannerModelName;
    }

    provideModelOverride(): string | undefined {
        return this.plannerModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        return 'planner';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}

function serializeExecutorMessage(message: InboxMessage): ChatInputPayload {
    switch (message.type) {
        case 'userRequest':
            return message.toChatInputPayload({hideUserRequest: true});
        case 'toolCall':
            return message.toChatInputPayload({hidePlanDetail: true});
        default:
            return message.toChatInputPayload();
    }
}

class RingRingActorRole implements ChatRole {
    private readonly actorModelName: string;

    constructor(actorModelName: string) {
        this.actorModelName = actorModelName;
    }

    provideModelOverride(): string | undefined {
        return this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        return 'actor';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(serializeExecutorMessage);
    }
}

class RingRingCoderRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly coderModelName: string | null;

    constructor(actorModelName: string, coderModelName: string | null) {
        this.actorModelName = actorModelName;
        this.coderModelName = coderModelName;
    }

    provideModelOverride(): string | undefined {
        return this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        return 'coder';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(serializeExecutorMessage);
    }
}

export class RingRingChatCapabilityProvider extends ChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'ringRing';
    }

    protected getChatRole(): ChatRole {
        const messages = this.thread.toMessages();

        // Only user request message, the first reply should be in plan mode
        if (messages.every(v => v.type === 'userRequest' || v.type === 'assistantText')) {
            return new RingRingPlannerRole(this.config.plannerModel);
        }

        const plan = this.roundtrip.findLastToolCallChunkByToolNameStrict('create_plan');
        const executingTask = plan.arguments.tasks.find(v => v.status === 'executing');
        if (executingTask) {
            return executingTask.taskType === 'coding'
                ? new RingRingCoderRole(this.config.actorModel, this.config.coderModel)
                : new RingRingActorRole(this.config.actorModel);
        }
        return new RingRingPlannerRole(this.config.plannerModel);
    }
}
