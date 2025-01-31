import styled from '@emotion/styled';
import {IoChatbubbleEllipsesOutline} from 'react-icons/io5';

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

export default function Thinking() {
    return (
        <Layout>
            <IoChatbubbleEllipsesOutline />
            Oniichan is burning his brain...
        </Layout>
    );
}
