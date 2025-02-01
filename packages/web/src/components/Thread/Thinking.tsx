import styled from '@emotion/styled';
import {IoChatbubbleEllipsesOutline} from 'react-icons/io5';

const Content = styled.p`
    white-space: pre-wrap;
    margin: 0;
`;

const Layout = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
    margin: 1em 0;
    border: 1px solid var(--color-default-border);
    border-radius: .5em;
    padding: .5em 1em;
    cursor: default;

    + & {
        margin-top: 0;
    }
`;

const DebugTitle = styled.div`
    display: flex;
    gap: .5em;
    align-items: center;
`;

const DebugLayout = styled(Layout)`
    flex-direction: column;
    align-items: flex-start;
    background-color: var(--color-contrast-background);
    font-size: .8em;
`;

interface Props {
    content: string;
}

export default function Thinking({content}: Props) {
    if (process.env.NODE_ENV === 'development') {
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

    return (
        <Layout>
            <IoChatbubbleEllipsesOutline />
            Oniichan is burning his brain...
        </Layout>
    );
}
