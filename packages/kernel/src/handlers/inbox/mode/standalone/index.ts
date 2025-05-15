import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {ChatCapabilityProvider} from '../base/provider';
import type {ChatRole} from '../base/provider';
import {StandaloneRole} from './role';

export class StandaloneChatCapabilityProvider extends ChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'normal';
    }

    provideChatRole(): ChatRole {
        return new StandaloneRole(this.config.defaultModel);
    }
}
