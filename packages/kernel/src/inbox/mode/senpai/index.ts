import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {isBreakpoingToolCallMessage} from '../../assert.js';
import {BaseChatCapabilityProvider} from '../provider.js';
import type {ChatRole} from '../interface.js';
import {SenpaiActorRole} from './actor.js';
import {SenpaiReviewerRole} from './reviewer.js';

export class SenpaiChatCapabilityProvider extends BaseChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'senpai';
    }

    provideChatRole(): ChatRole {
        const messages = this.thread.toMessages();
        const lastStop = messages.findLast(isBreakpoingToolCallMessage);
        return lastStop?.getRole() === 'actor'
            ? new SenpaiReviewerRole()
            : new SenpaiActorRole(this.config.defaultModel);
    }
}
