import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {ChatCapabilityProvider} from '../base/provider';
import type {ChatRole} from '../base/provider';
import {RingRingPlannerRole} from './planner';
import {RingRingActorRole} from './actor';
import {RingRingCoderRole} from './coder';

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
