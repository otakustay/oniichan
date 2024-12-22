import styled from '@emotion/styled';
import {useMessageThreadValueByUuid} from '@/atoms/inbox';
import {TimeAgo} from '@/components/TimeAgo';
import Avatar from '@/components/Avatar';
import Markdown from '@/components/Markdown';

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1em;
    border-radius: 1em;
    background-color: var(--color-default-background);
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: .5em;
    border-bottom: 1px solid var(--color-default-bottom);
    align-items: center;
`;

const Time = styled(TimeAgo)`
    color: var(--color-secondary-foreground);
`;

const Sender = styled.span`
    font-size: 1.2em;
    font-weight: bold;
    display: flex;
    gap: .2em;
    align-items: center;
`;

const Content = styled(Markdown)`
    padding-top: .5em;
    white-space: pre-wrap;
`;

interface Props {
    threadUuid: string;
    uuid: string;
}

export default function Message({threadUuid, uuid}: Props) {
    const thread = useMessageThreadValueByUuid(threadUuid);

    if (!thread) {
        return null;
    }

    const message = thread.messages.find(v => v.uuid === uuid);

    if (!message) {
        return null;
    }

    return (
        <Layout>
            <Header>
                <Sender>
                    {message.sender === 'assistant' ? <Avatar.Assistant /> : <Avatar.User />}
                    {message.sender === 'assistant' ? 'Oniichan' : 'Me'}
                </Sender>
                <Time time={message.createdAt} />
            </Header>
            <Content content={message.content} />
        </Layout>
    );
}
