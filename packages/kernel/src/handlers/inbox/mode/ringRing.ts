import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole} from '@oniichan/shared/inbox';
import type {InboxMessage} from '../../../inbox';
import {ChatContextProvider} from './base';
import {SystemPromptGenerator} from './prompt';
import type {SystemPromptGeneratorInit} from './prompt';

export class RingRingChatContextProvider extends ChatContextProvider {
    async provideAssistantRole(): Promise<AssistantRole> {
        return this.getRingRingRole();
    }

    protected async provideModelName(): Promise<string | undefined> {
        const role = this.getRingRingRole();
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
        const role = this.getRingRingRole();
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

    protected async provideSystemPrompt(): Promise<string> {
        const generatorInit: SystemPromptGeneratorInit = {
            role: this.getRingRingRole(),
            workingMode: 'ringRing',
            modelFeature: await this.modelAccess.getModelFeature(),
            logger: this.logger,
            references: this.references,
            editorHost: this.editorHost,
        };
        const generator = new SystemPromptGenerator(generatorInit);
        return generator.renderSystemPrompt();
    }

    private getRingRingRole(): AssistantRole {
        const messages = this.thread.toMessages();

        // Only user request message, the first reply should be in plan mode
        if (messages.every(v => v.type === 'userRequest' || v.type === 'assistantText')) {
            return 'planner';
        }

        const plan = this.roundtrip.findLastToolCallChunkByToolNameStrict('create_plan');
        const executingTask = plan.arguments.tasks.find(v => v.status === 'executing');
        return executingTask ? (executingTask.taskType === 'coding' ? 'coder' : 'actor') : 'planner';
    }
}
