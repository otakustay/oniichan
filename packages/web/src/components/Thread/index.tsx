import styled from '@emotion/styled';
import {AssistantTextMessageData, MessageData} from '@oniichan/shared/inbox';
import {useMessageThreadValueByUuid} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';
import {mediaWideScreen} from '@/styles';
import {useKeyboardShortcut} from '@/hooks/keyboard';
import Draft from '../Draft';
import Message from './Message';
import {RoundtripMessageData} from 'node_modules/@oniichan/shared/dist/inbox/thread';

function buildMessageDataSource(roundtrip: RoundtripMessageData): MessageData[] {
    if (process.env.NODE_ENV === 'development') {
        return roundtrip.messages;
    }

    // Combine messages in roundtrip to a single response
    const messages: MessageData[] = [];
    const [request, reply, ...reactions] = roundtrip.messages;
    messages.push(request);
    const response: AssistantTextMessageData = {
        type: 'assistantText',
        chunks: [],
        uuid: reply.uuid,
        createdAt: reply.createdAt,
        error: reply.error,
    };
    messages.push(response);
    for (const reaction of reactions) {
        if (reaction.type === 'assistantText' || reaction.type === 'toolCall') {
            response.chunks.push(...reaction.chunks.filter(v => v.type !== 'thinking'));
            if (reaction.error) {
                response.error = reaction.error;
            }
        }
    }
    return messages;
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
