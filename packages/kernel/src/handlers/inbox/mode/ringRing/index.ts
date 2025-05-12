import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import type {InboxMessage} from '../../../../inbox';
import {ChatCapabilityProvider} from '../base';

export class RingRingChatCapabilityProvider extends ChatCapabilityProvider {
    async provideAssistantRole(): Promise<AssistantRole> {
        const messages = this.thread.toMessages();

        // Only user request message, the first reply should be in plan mode
        if (messages.every(v => v.type === 'userRequest' || v.type === 'assistantText')) {
            return 'planner';
        }

        const plan = this.roundtrip.findLastToolCallChunkByToolNameStrict('create_plan');
        const executingTask = plan.arguments.tasks.find(v => v.status === 'executing');
        return executingTask ? (executingTask.taskType === 'coding' ? 'coder' : 'actor') : 'planner';
    }

    protected async provideModelName(): Promise<string | undefined> {
        const role = await this.provideAssistantRole();
        switch (role) {
            case 'planner':
                return this.config.plannerModel;
            case 'actor':
                return this.config.actorModel;
            case 'coder':
                return this.config.coderModel || this.config.actorModel;
        }
    }

    protected async provideChatMessages(): Promise<ChatInputPayload[]> {
        const messages = this.getInboxMessages();
        const role = await this.provideAssistantRole();
        const isPlanExecutor = role === 'actor' || role === 'coder';
        const messageToChatInputPayload = (message: InboxMessage): ChatInputPayload => {
            switch (message.type) {
                case 'userRequest':
                    return message.toChatInputPayload({hideUserRequest: isPlanExecutor});
                case 'toolCall':
                    return message.toChatInputPayload({hidePlanDetail: isPlanExecutor});
                default:
                    return message.toChatInputPayload();
            }
        };
        return messages.map(messageToChatInputPayload);
    }

    protected async provideWorkingMode(): Promise<MessageThreadWorkingMode> {
        return 'ringRing';
    }
}
