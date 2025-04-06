import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {motion} from 'motion/react';
import {useEditingValue, useSetEditing, useSubmitableDraftContent} from '@oniichan/web-host/atoms/draft';
import type {EditingValue} from '@oniichan/web-host/atoms/draft';
import {useMessageThreadValueByUuid, useSendMessageToThread} from '@oniichan/web-host/atoms/inbox';
import Modal from '@/components/Modal';
import {useIpc, useIsWideScreen} from '@/components/AppProvider';
import {Alert} from '@/components/Alert';
import {mediaWideScreen} from '@/styles';
import {Receiver} from './Receiver';
import SendTrigger from './SendTrigger';
import MessageEditor from './Editor';

function warning(count: number) {
    return `${count} ${count > 1 ? 'files' : 'file'} pending review, replying will discard edits`;
}

const Warning = styled(Alert)`
    margin: .5em 0;
`;

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

const Editor = styled(MessageEditor)`
    flex: 1;
`;

function Content({threadUuid, mode}: EditingValue) {
    const isWideScreen = useIsWideScreen();
    const content = useSubmitableDraftContent();
    const [discardingEditCount, setDiscardingEditCount] = useState(0);
    const setEditing = useSetEditing();
    const sendMessage = useSendMessageToThread(threadUuid);
    const thread = useMessageThreadValueByUuid(threadUuid);
    const requestMessageUuid = thread?.roundtrips.at(-1)?.request.uuid;
    const ipc = useIpc();
    useEffect(
        () => {
            if (mode === 'new' || !threadUuid || !requestMessageUuid) {
                return;
            }

            void (async () => {
                try {
                    const applyState = await ipc.kernel.call(
                        crypto.randomUUID(),
                        'inboxCheckEdit',
                        {threadUuid, requestMessageUuid}
                    );
                    setDiscardingEditCount(applyState.totalEditCount - applyState.appliedEditCount);
                }
                catch {
                    setDiscardingEditCount(0);
                }
            })();
        },
        [ipc, threadUuid, requestMessageUuid, mode]
    );
    const send = async () => {
        await sendMessage(crypto.randomUUID(), content);
    };
    const contentElement = (
        <>
            <Header>
                {mode === 'reply' ? 'Reply Message' : 'New Message'}
                <SendTrigger disabled={!content.trim()} onClick={send} />
            </Header>
            <Receiver />
            {!!discardingEditCount && <Warning type="warn" message={warning(discardingEditCount)} />}
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
