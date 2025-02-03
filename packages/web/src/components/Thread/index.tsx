import styled from '@emotion/styled';
import {AssistantTextMessageData, MessageData, MessageThreadData} from '@oniichan/shared/inbox';
import {useMessageThreadValueByUuid} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';
import {mediaWideScreen} from '@/styles';
import {useKeyboardShortcut} from '@/hooks/keyboard';
import Draft from '../Draft';
import Message from './Message';

function buildMessageDataSource(thread: MessageThreadData): MessageData[] {
    if (process.env.NODE_ENV === 'development') {
        return thread.roundtrips.flatMap(v => v.messages);
    }

    // Combine messages in roundtrip to a single response
    const messages: MessageData[] = [];
    for (const roundtrip of thread.roundtrips) {
        const [request, reply, ...reactions] = roundtrip.messages;
        messages.push(request);
        const response: AssistantTextMessageData = {
            type: 'assistantText',
            chunks: [],
            uuid: reply.uuid,
            createdAt: reply.createdAt,
            status: reply.status,
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

    const messages = buildMessageDataSource(thread);

    return (
        <Layout>
            {editing?.mode === 'reply' && <Draft />}
            {messages.map(v => <Message key={v.uuid} threadUuid={thread.uuid} message={v} />)}
        </Layout>
    );
}
