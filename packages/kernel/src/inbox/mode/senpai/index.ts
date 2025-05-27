import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {isBreakpoingToolCallMessage} from '../../assert';
import {BaseChatCapabilityProvider} from '../provider';
import type {ChatRole} from '../interface';
import {SenpaiActorRole} from './actor';
import {SenpaiReviewerRole} from './reviewer';

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
