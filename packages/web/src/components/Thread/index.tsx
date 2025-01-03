import styled from '@emotion/styled';
import {useMessageThreadValueByUuid, useSetActiveMessageThread} from '@oniichan/web-host/atoms/inbox';
import {FaAngleLeft, FaReply} from 'react-icons/fa';
import HeadNavigation from '@/components/HeadNavigation';
import InteractiveLabel from '@/components/InteractiveLabel';
import Message from './Message';
import {useSetEditing} from '@oniichan/web-host/atoms/draft';

const Back = styled(InteractiveLabel)`
    display: flex;
    align-items: center;
`;

const Reply = styled(InteractiveLabel)`
    display: flex;
    align-items: center;
    gap: .5em;
`;

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    gap: .5em;
`;

interface Props {
    uuid: string;
}

export default function Thread({uuid}: Props) {
    const setEditing = useSetEditing();
    const setActive = useSetActiveMessageThread();
    const thread = useMessageThreadValueByUuid(uuid);

    if (!thread) {
        return <div>Not Found</div>;
    }

    return (
        <>
            <HeadNavigation
                title={
                    <Back onClick={() => setActive(null)}>
                        <FaAngleLeft />
                        Inbox
                    </Back>
                }
                description={
                    <Reply onClick={() => setEditing({threadUuid: uuid, mode: 'reply'})}>
                        <FaReply />
                        Reply
                    </Reply>
                }
            />
            <Layout>
                {thread.messages.map(v => <Message key={v.uuid} threadUuid={thread.uuid} message={v} />)}
            </Layout>
        </>
    );
}
