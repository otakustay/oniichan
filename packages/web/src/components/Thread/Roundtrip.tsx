import type {MessageViewChunk, MessageViewData, RoundtripMessageData} from '@oniichan/shared/inbox';
import Message from './Message';
import FileEditContextProvider from './FileEditContext';
import {EditSummary} from './EditSummary';

function isVisibleChunk(chunk: MessageViewChunk): boolean {
    // Remove thinking chunks from UI
    return chunk.type !== 'content' || chunk.tagName !== 'thinking';
}

interface MessageView {
    message: MessageViewData;
    isActive: boolean;
    isReasoning: boolean;
}

function buildMessageDataSource(roundtrip: RoundtripMessageData): MessageView[] {
    const messages: MessageView[] = [
        {message: roundtrip.request, isActive: false, isReasoning: false},
    ];

    if (!roundtrip.responses.length) {
        return messages;
    }

    // Combine messages in roundtrip to a single response
    const [reply, ...reactions] = roundtrip.responses;
    const response: MessageViewData = {
        type: 'assistantResponse',
        chunks: reply.chunks.filter(isVisibleChunk),
        uuid: reply.uuid,
        createdAt: reply.createdAt,
        error: reply.error,
    };
    for (const reaction of reactions) {
        if (reaction.error) {
            response.error = reaction.error;
        }
        response.chunks.push(...reaction.chunks.filter(isVisibleChunk));
    }

    const view: MessageView = {
        message: response,
        isActive: true,
        isReasoning: response.chunks.at(-1)?.type === 'reasoning',
    };
    messages.push(view);

    // As a mail inbox, the latest message is on top
    return messages.reverse();
}

interface Props {
    threadUuid: string;
    roundtrip: RoundtripMessageData;
    isEditInteractive: boolean;
}

export default function Roundtrip({threadUuid, roundtrip, isEditInteractive}: Props) {
    const messages = buildMessageDataSource(roundtrip);
    const renderMessageView = (view: MessageView) => (
        <Message
            key={view.message.uuid}
            threadUuid={threadUuid}
            roundtripStatus={roundtrip.status}
            message={view.message}
            showIndicator={roundtrip.status === 'running' && view.isActive}
            showRollback={view.message.type === 'assistantResponse' && !isEditInteractive}
            reasoning={view.isReasoning}
        />
    );

    return (
        <FileEditContextProvider isEditInteractive={isEditInteractive} roundtrip={roundtrip}>
            {isEditInteractive && <EditSummary />}
            {messages.map(renderMessageView)}
        </FileEditContextProvider>
    );
}
