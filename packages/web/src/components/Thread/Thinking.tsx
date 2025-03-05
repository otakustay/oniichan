import styled from '@emotion/styled';
import {IoChatbubbleEllipsesOutline} from 'react-icons/io5';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import ActBar from '@/components/ActBar';
import {ContentTagName} from '@oniichan/shared/tool';

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
    tagName: ContentTagName;
    content: string;
}

export default function Thinking({tagName, content}: Props) {
    const viewMode = useViewModeValue();
    if (viewMode.debug || tagName !== 'thinking') {
        return (
            <DebugLayout>
                <DebugTitle>
                    <IoChatbubbleEllipsesOutline />
                    {tagName === 'thinking' ? 'Thinking...' : (tagName === 'plan' ? 'Planning...' : 'Conclusion...')}
                </DebugTitle>
                <Content>{content.trim()}</Content>
            </DebugLayout>
        );
    }

    return <ActBar icon={<IoChatbubbleEllipsesOutline />} content="Oniichan is figuring out a best action..." />;
}
