import styled from '@emotion/styled';
import {motion} from 'motion/react';
import {EditingValue, useDraftContentValue, useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';
import {useSendMessageToThread} from '@oniichan/web-host/atoms/inbox';
import Modal from '@/components/Modal';
import Avatar from '@/components/Avatar';
import {useIsWideScreen} from '@/components/AppProvider';
import {mediaWideScreen} from '@/styles';
import MessageEditor from './Editor';
import SendTrigger from './SendTrigger';

const Layout = styled(motion.div)`
    padding: 1em;
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-default-background);
    border-radius: var(--item-border-radius, 0);

    @media not (${mediaWideScreen}) {
        position: fixed;
        left: 0;
        bottom: 0;
        width: 100vw;
        height: 90vh;
        border-radius: var(--item-border-radius, 0) var(--item-border-radius, 0) 0 0;
    }
`;

const Header = styled.div`
    font-size: 2em;
    padding-bottom: .5em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
`;

const Receiver = styled.div`
    display: flex;
    gap: .4em;
    align-items: center;
    color: #aaa;
    padding-bottom: 1em;
    border-bottom: 1px solid var(--color-default-border);
`;

const Editor = styled(MessageEditor)`
    flex: 1;
`;

function Content({threadUuid, mode}: EditingValue) {
    const isWideScreen = useIsWideScreen();
    const content = useDraftContentValue();
    const setEditing = useSetEditing();
    const sendMessage = useSendMessageToThread(threadUuid);
    const send = async () => {
        await sendMessage(crypto.randomUUID(), content);
    };
    const contentElement = (
        <>
            <Header>
                {mode === 'reply' ? 'Reply Message' : 'New Message'}
                <SendTrigger disabled={!content.trim()} onClick={send} />
            </Header>
            <Receiver>
                To: <Avatar.Assistant size="1em" />Oniichan
            </Receiver>
            <Editor onSend={send} />
        </>
    );

    if (isWideScreen) {
        return (
            <Layout>
                {contentElement}
            </Layout>
        );
    }

    return (
        <Modal onClose={() => setEditing(null)}>
            <Layout initial={{translateY: '100%'}} animate={{translateY: 0}} transition={{ease: 'easeInOut'}}>
                {contentElement}
            </Layout>
        </Modal>
    );
}

export default function Draft() {
    const editing = useEditingValue();

    if (!editing) {
        return null;
    }

    return <Content {...editing} />;
}
