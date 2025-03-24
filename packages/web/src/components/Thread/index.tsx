import styled from '@emotion/styled';
import type {RoundtripMessageData} from '@oniichan/shared/inbox';
import {useMessageThreadValueByUuid} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';
import Draft from '../Draft';
import Roundtrip from './Roundtrip';
import {mediaWideScreen} from '@/styles';
import {useKeyboardShortcut} from '@/hooks/keyboard';

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

    const lastRoundtrip = thread.roundtrips.at(-1);
    // As a mail inbox, the latest roundtrip is on top
    const roundtrips = [...thread.roundtrips].reverse();
    const renderRoundtrip = (roundtrip: RoundtripMessageData) => {
        const key = roundtrip.request.uuid;
        return (
            <Roundtrip
                key={key}
                threadUuid={thread.uuid}
                roundtrip={roundtrip}
                isEditInteractive={roundtrip === lastRoundtrip}
            />
        );
    };

    return (
        <Layout>
            {editing?.mode === 'reply' && <Draft />}
            {roundtrips.map(renderRoundtrip)}
        </Layout>
    );
}
