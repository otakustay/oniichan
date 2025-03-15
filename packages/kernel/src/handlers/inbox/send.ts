import {over} from '@otakustay/async-iterator';
import {stringifyError} from '@oniichan/shared/error';
import type {InboxPromptReference} from '@oniichan/prompt';
import {setRoundtripRequest} from '../../inbox';
import {InboxRequestHandler} from './handler';
import type {InboxMessageResponse} from './handler';
import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';

interface TextMessageBody {
    type: 'text';
    content: string;
}

type MessageBody = TextMessageBody;

export interface InboxSendMessageRequest {
    threadUuid: string;
    uuid: string;
    workingMode: MessageThreadWorkingMode;
    body: MessageBody;
    references?: InboxPromptReference[];
}

export class InboxSendMessageHandler extends InboxRequestHandler<InboxSendMessageRequest, InboxMessageResponse> {
    static readonly action = 'inboxSendMessage';

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxMessageResponse> {
        const {logger} = this.context;
        logger.info('Start', payload);

        try {
            yield* this.telemetry.spyStreaming(() => this.chat(payload));
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
        }
        finally {
            logger.trace('MarkRoundtripUnread', {threadUuid: this.thread.uuid, messageUuid: payload.uuid});
            this.roundtrip.markStatus('unread');

            this.pushStoreUpdate(this.thread.uuid);
        }
    }

    private async *chat(payload: InboxSendMessageRequest) {
        const {store, logger} = this.context;
        await this.prepareEnvironment();

        logger.trace('EnsureRoundtrip');
        this.thread = store.ensureThread(payload.threadUuid, payload.workingMode);
        setRoundtripRequest(this.roundtrip, payload.uuid, payload.body.content);
        this.thread.addRoundtrip(this.roundtrip);
        this.addReference(payload.references ?? []);
        store.moveThreadToTop(this.thread.uuid);

        yield* over(this.requestModelChat()).map(v => ({type: 'value', value: v} as const));
    }
}
