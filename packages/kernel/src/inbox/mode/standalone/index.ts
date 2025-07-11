import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {BaseChatCapabilityProvider} from '../provider.js';
import type {ChatRole} from '../interface.js';
import {StandaloneRole} from './role.js';

export class StandaloneChatCapabilityProvider extends BaseChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'normal';
    }

    provideChatRole(): ChatRole {
        return new StandaloneRole(this.config.defaultModel);
    }
}
