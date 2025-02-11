import styled from '@emotion/styled';
import {IoChatbubbleEllipsesOutline} from 'react-icons/io5';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import ActBar from '@/components/ActBar';

const Content = styled.p`
    white-space: pre-wrap;
    margin: 0;
`;

const DebugTitle = styled.div`
    display: flex;
    gap: .5em;
    align-items: center;
`;

const DebugLayout = styled(ActBar.Layout)`
    flex-direction: column;
    align-items: flex-start;
    background-color: var(--color-contrast-background);
    font-size: .8em;
`;

interface Props {
    content: string;
}

export default function Thinking({content}: Props) {
    const viewMode = useViewModeValue();
    if (viewMode.debug) {
        return (
            <DebugLayout>
                <DebugTitle>
                    <IoChatbubbleEllipsesOutline />
                    Thinking...
                </DebugTitle>
                <Content>{content.trim()}</Content>
            </DebugLayout>
        );
    }

    return <ActBar icon={<IoChatbubbleEllipsesOutline />} content="Oniichan is burning his brain..." />;
}
