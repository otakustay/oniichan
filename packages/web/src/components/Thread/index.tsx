import styled from '@emotion/styled';
import {RoundtripMessageData} from '@oniichan/shared/inbox';
import {useMessageThreadValueByUuid} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue, useSetEditing} from '@oniichan/web-host/atoms/draft';
import {mediaWideScreen} from '@/styles';
import {useKeyboardShortcut} from '@/hooks/keyboard';
import Draft from '../Draft';
import Roundtrip from './Roundtrip';

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
        const key = roundtrip.messages.at(0)?.uuid ?? crypto.randomUUID();
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
