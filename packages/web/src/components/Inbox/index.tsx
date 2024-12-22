import styled from '@emotion/styled';
import {HiOutlinePencilAlt} from 'react-icons/hi';
import '@/styles';
import {useSetEditing} from '@/atoms/draft';
import Button from '@/components/Button';
import HeadNavigation from '@/components/HeadNavigation';
import ThreadList from './ThreadList';

const EditTrigger = styled(Button)`
    position: fixed;
    bottom: 2rem;
    right: 1rem;
    width: 2em;
    height: 2em;
    font-size: 1.5rem;
    border-radius: 50%;
`;

export default function Inbox() {
    const setEditing = useSetEditing();

    return (
        <>
            <HeadNavigation title="Inbox" description="All your messages" />
            <ThreadList />
            <EditTrigger onClick={() => setEditing({threadUuid: crypto.randomUUID(), mode: 'new'})}>
                <HiOutlinePencilAlt />
            </EditTrigger>
        </>
    );
}
