import type {ChatInputPayload} from '@oniichan/shared/model';
import type {InboxMessage} from '../../../../inbox';

export function serializeExecutorMessage(message: InboxMessage): ChatInputPayload {
    switch (message.type) {
        case 'userRequest':
            return message.toChatInputPayload({hideUserRequest: true});
        case 'toolCall':
            return message.toChatInputPayload({hidePlanDetail: true});
        default:
            return message.toChatInputPayload();
    }
}
