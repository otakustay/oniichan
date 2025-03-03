import {MessageViewData, ReasoningMessageChunk, RoundtripMessageData} from '@oniichan/shared/inbox';
import Message from './Message';
import FileEditContextProvider from './FileEditContext';
import {EditSummary} from './EditSummary';

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
    const reasoningChunk: ReasoningMessageChunk = {
        type: 'reasoning',
        content: reply.chunks.find(v => v.type === 'reasoning')?.content ?? '',
    };
    const response: MessageViewData = {
        type: 'assistantResponse',
        chunks: reply.chunks.filter(v => v.type !== 'reasoning'),
        uuid: reply.uuid,
        createdAt: reply.createdAt,
        error: reply.error,
    };
    for (const reaction of reactions) {
        const reasoningContent = reaction.chunks.find(v => v.type === 'reasoning')?.content;
        // `reasoningContent` can be an empty string for a short time,
        // in this case we should keep reasoning text from the previous message
        if (reasoningContent) {
            reasoningChunk.content = reasoningContent;
        }
        if (reaction.error) {
            response.error = reaction.error;
        }
        response.chunks.push(...reaction.chunks.filter(v => v.type !== 'thinking' && v.type !== 'reasoning'));
    }
    if (reasoningChunk.content) {
        response.chunks.unshift(reasoningChunk);
    }

    const lastMessage = reactions.at(-1) ?? reply;
    const lastReasoningChunkIndex = lastMessage.chunks.findIndex(v => v.type === 'reasoning');
    const view: MessageView = {
        message: response,
        isActive: true,
        isReasoning: !!lastMessage && lastReasoningChunkIndex === lastMessage.chunks.length - 1,
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
