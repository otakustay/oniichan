import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {isBreakpoingToolCallMessage} from '../../assert';
import {BaseChatCapabilityProvider} from '../provider';
import type {ChatRole} from '../interface';
import {HenshinActorRole} from './actor';
import {HenshinCoderRole} from './coder';

export class HenshinChatCapabilityProvider extends BaseChatCapabilityProvider {
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
