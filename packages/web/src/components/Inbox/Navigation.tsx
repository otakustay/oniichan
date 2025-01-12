import styled from '@emotion/styled';
import {FaAngleLeft, FaReply, FaTimes, FaPen} from 'react-icons/fa';
import HeadNavigation from '@/components/HeadNavigation';
import InteractiveLabel from '@/components/InteractiveLabel';
import {useActiveMessageThreadValue, useSetActiveMessageThread} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';

const Back = styled(InteractiveLabel)`
    display: flex;
    align-items: center;
`;

const Action = styled(InteractiveLabel)`
    display: flex;
    align-items: center;
    gap: .5em;
`;

export default function Navigation() {
    const activeThread = useActiveMessageThreadValue();
    const editingValue = useEditingValue();
    const setEditing = useSetEditing();
    const setActive = useSetActiveMessageThread();
    const renderTitle = () => {
        if (activeThread) {
            return (
                <Back onClick={() => setActive(null)}>
                    <FaAngleLeft />
                    Inbox
                </Back>
            );
        }
        return <>Inbox</>;
    };
    const renderAction = () => {
        if (editingValue) {
            return (
                <Action onClick={() => setEditing(null)}>
                    <FaTimes />
                    Cancel
                </Action>
            );
        }
        if (activeThread) {
            return (
                <Action onClick={() => setEditing({threadUuid: activeThread.uuid, mode: 'reply'})}>
                    <FaReply />
                    Reply
                </Action>
            );
        }
        return (
            <Action onClick={() => setEditing({threadUuid: crypto.randomUUID(), mode: 'new'})}>
                <FaPen />
                New
            </Action>
        );
    };

    return <HeadNavigation title={renderTitle()} description={renderAction()} />;
}
