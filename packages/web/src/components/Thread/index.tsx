import styled from '@emotion/styled';
import {
    AssistantTextMessageData,
    MessageData,
    RoundtripMessageData,
    ToolCallMessageData,
} from '@oniichan/shared/inbox';
import {useMessageThreadValueByUuid} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {mediaWideScreen} from '@/styles';
import {useKeyboardShortcut} from '@/hooks/keyboard';
import Draft from '../Draft';
import Message from './Message';

type ProductionMessageData = AssistantTextMessageData | ToolCallMessageData;

function isProductionMessage(message: MessageData): message is ProductionMessageData {
    return message.type === 'assistantText' || message.type === 'toolCall';
}

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    gap: .5em;
    --item-border-radius: 1rem;

    @media (${mediaWideScreen}) {
        padding: 0 1em;
    }
`;

interface Props {
    uuid: string;
}

export default function Thread({uuid}: Props) {
    const viewMode = useViewModeValue();
    const thread = useMessageThreadValueByUuid(uuid);
    const editing = useEditingValue();
    const setEditing = useSetEditing();
    useKeyboardShortcut(
        {key: 'r', shift: true},
        () => {
            if (thread) {
                setEditing({mode: 'reply', threadUuid: thread.uuid});
            }
        }
    );
    const buildMessageDataSource = (roundtrip: RoundtripMessageData): MessageData[] => {
        if (viewMode.debug) {
            return roundtrip.messages;
        }

        const [request, ...responses] = roundtrip.messages;

        const messages: MessageData[] = [];
        messages.push(request);

        if (!responses.length) {
            return messages;
        }

        // Combine messages in roundtrip to a single response
        const [reply, ...reactions] = responses.filter(isProductionMessage);
        const response: AssistantTextMessageData = {
            type: 'assistantText',
            chunks: [...reply.chunks],
            uuid: reply.uuid,
            createdAt: reply.createdAt,
            error: reply.error,
        };
        messages.push(response);
        for (const reaction of reactions) {
            response.chunks.push(...reaction.chunks.filter(v => v.type !== 'thinking'));
            if (reaction.error) {
                response.error = reaction.error;
            }
        }
        return messages;
    };

    if (!thread) {
        return <div>Not Found</div>;
    }

    const renderRoundtrip = (roundtrip: RoundtripMessageData) => {
        const messages = buildMessageDataSource(roundtrip);
        const renderMessage = (message: MessageData) => (
            <Message
                key={message.uuid}
                threadUuid={thread.uuid}
                roundtripStatus={roundtrip.status}
                message={message}
            />
        );
        return messages.map(renderMessage);
    };

    return (
        <Layout>
            {editing?.mode === 'reply' && <Draft />}
            {thread.roundtrips.map(renderRoundtrip)}
        </Layout>
    );
}
