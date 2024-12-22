import {ReactNode} from 'react';
import styled from '@emotion/styled';

const Title = styled.span`
    display: flex;
    align-items: center;
    font-size: 2em;
    font-weight: bold;
`;

const Description = styled.span`
    color: var(--color-secondary-foreground);
`;

const Layout = styled.div`
    position: sticky;
    top: 0;
    width: 100%;
    display: flex;
    height: 4em;
    background-color: var(--color-root-background);
    align-items: center;
    justify-content: space-between;
    padding: 0 1em;
`;

interface Props {
    title: ReactNode;
    description?: ReactNode;
}

export default function HeadNavigation({title, description}: Props) {
    return (
        <Layout>
            <Title>
                {title}
            </Title>
            {description && <Description>{description}</Description>}
        </Layout>
    );
}
