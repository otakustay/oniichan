import type {ReactElement, ReactNode} from 'react';
import styled from '@emotion/styled';

const TitleLabel = styled.span`
    flex: 1;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
    height: 2.5em;
    padding: 0 1em;
    border-radius: .5em .5em 0 0;
    border: 1px solid var(--color-default-border);
    border-bottom: none;
    background-color: var(--color-contrast-background);
`;

const Body = styled.div`
    border: 1px solid var(--color-default-border);
    padding: .5em;
    border-radius: 0 0 .5em .5em;
`;

const ActionBar = styled.div`
    display: flex;
    justify-content: end;
    padding: .5em 1em;
`;

const Layout = styled.div`
    margin: 1em 0;

    + & {
        margin-top: 0;
    }
`;

interface Props {
    titleIcon: ReactElement;
    title: string;
    statusIcon?: ReactElement;
    content: ReactNode;
    actions?: ReactElement | null | undefined | false;
}

export default function TitledActBar({titleIcon, title, statusIcon, content, actions}: Props) {
    return (
        <Layout>
            <Title>
                {titleIcon}
                <TitleLabel>{title}</TitleLabel>
                {statusIcon}
            </Title>
            <Body>
                {content}
                {actions && <ActionBar>{actions}</ActionBar>}
            </Body>
        </Layout>
    );
}
