import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {isBreakpoingToolCallMessage} from '../../../../inbox';
import {ChatCapabilityProvider} from '../base/provider';
import type {ChatRole} from '../base/provider';
import {HenshinActorRole} from './actor';
import {HenshinCoderRole} from './coder';

export class HenshinChatCapabilityProvider extends ChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'henshin';
    }

    provideChatRole(): ChatRole {
        const messages = this.thread.toMessages();
        const lastStop = messages.findLast(isBreakpoingToolCallMessage);
        const toolName = lastStop?.findToolCallChunkStrict().toolName;
        // Always use actor to start the work
        return toolName === 'semantic_edit_code'
            ? new HenshinCoderRole(this.config.actorModel, this.config.coderModel)
            : new HenshinActorRole(this.config.actorModel);
    }
}
