import styled from '@emotion/styled';
import {useActiveMessageThreadValue} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue} from '@oniichan/web-host/atoms/draft';
import {mediaWideScreen} from '@/styles';
import Thread from '@/components/Thread';
import Draft from '@/components/Draft';

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

export default function MainContent() {
    const activeThread = useActiveMessageThreadValue();
    const editing = useEditingValue();

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

    return null;
}
