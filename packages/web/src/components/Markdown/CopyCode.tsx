import {useCallback} from 'react';
import styled from '@emotion/styled';
import {useTransitionState} from 'huse';
import {IoCheckmarkOutline, IoCopyOutline} from 'react-icons/io5';
import CopyToClipboard from 'react-copy-to-clipboard';

const Layout = styled.span`
    display: flex;
    align-items: center;
    gap: .5em;
    cursor: pointer;
`;

interface Props {
    text: string;
}

export function CopyCode({text}: Props) {
    const [noticing, setNoticing] = useTransitionState(false, 2500);
    const copy = useCallback(
        () => setNoticing(true),
        [setNoticing]
    );

    return (
        <CopyToClipboard text={text} onCopy={copy}>
            <Layout>
                {noticing ? <IoCheckmarkOutline /> : <IoCopyOutline />}
                {noticing ? 'Copied to clipboard' : 'Copy'}
            </Layout>
        </CopyToClipboard>
    );
}
