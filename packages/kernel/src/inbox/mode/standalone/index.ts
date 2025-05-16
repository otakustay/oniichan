import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {BaseChatCapabilityProvider} from '../provider';
import type {ChatRole} from '../interface';
import {StandaloneRole} from './role';

export class StandaloneChatCapabilityProvider extends BaseChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'normal';
    }

    provideChatRole(): ChatRole {
        return new StandaloneRole(this.config.defaultModel);
    }
}
