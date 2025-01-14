import styled from '@emotion/styled';
import {useMessageThreadValueByUuid} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';
import {mediaWideScreen} from '@/styles';
import {useKeyboardShortcut} from '@/hooks/keyboard';
import Message from './Message';
import Draft from '../Draft';

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

    return (
        <Layout>
            {editing?.mode === 'reply' && <Draft />}
            {thread.messages.map(v => <Message key={v.uuid} threadUuid={thread.uuid} message={v} />)}
        </Layout>
    );
}
