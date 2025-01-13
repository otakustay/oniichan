import styled from '@emotion/styled';
import {useActiveMessageThreadValue} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue} from '@oniichan/web-host/atoms/draft';
import {mediaWideScreen} from '@/styles';
import Thread from '@/components/Thread';
import Draft from '@/components/Draft';
import {useIsWideScreen} from '@/components/AppProvider';

const Layout = styled.div`
    overflow-y: auto;
    height: calc(100vh - 4em);

    @media not (${mediaWideScreen}) {
        position: fixed;
        top: 4em;
        left: 0;
        right: 0;
        bottom: 0;
    }
`;

const Empty = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-secondary-foreground);
    font-size: 3em;
`;

export default function MainContent() {
    const activeThread = useActiveMessageThreadValue();
    const editing = useEditingValue();
    const isWideScreen = useIsWideScreen();

    if (editing?.mode === 'new') {
        return (
            <Layout>
                <Draft />
            </Layout>
        );
    }

    if (activeThread) {
        return (
            <Layout>
                <Thread uuid={activeThread.uuid} />
            </Layout>
        );
    }

    return isWideScreen ? <Empty>No Message Selected</Empty> : null;
}
