import {
    AssistantTextMessageData,
    isAssistantMessage,
    MessageData,
    ReasoningMessageChunk,
    RoundtripMessageData,
    ToolCallMessageData,
} from '@oniichan/shared/inbox';
import Message from './Message';
import FileEditContextProvider from './FileEditContext';
import {EditSummary} from './EditSummary';

interface MessageView {
    message: MessageData;
    isActive: boolean;
    isReasoning: boolean;
}

type ProductionMessageData = AssistantTextMessageData | ToolCallMessageData;

function isProductionMessage(message: MessageData): message is ProductionMessageData {
    return message.type === 'assistantText' || message.type === 'toolCall';
}

function buildMessageDataSource(roundtrip: RoundtripMessageData): MessageView[] {
    const messages: MessageView[] = [];

    const request = roundtrip.messages.at(0);
    const responses = roundtrip.messages.slice(1).filter(isProductionMessage);

    if (request) {
        messages.push({message: request, isActive: false, isReasoning: false});
    }

    if (!responses.length) {
        return messages;
    }

    // Combine messages in roundtrip to a single response
    const [reply, ...reactions] = responses;
    const reasoningChunk: ReasoningMessageChunk = {
        type: 'reasoning',
        content: reply.chunks.find(v => v.type === 'reasoning')?.content ?? '',
    };
    const response: AssistantTextMessageData = {
        type: 'assistantText',
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
            showRollback={isAssistantMessage(view.message.type) && !isEditInteractive}
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
