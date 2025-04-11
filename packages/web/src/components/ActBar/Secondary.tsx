import {useState} from 'react';
import type {ReactElement} from 'react';
import styled from '@emotion/styled';
import Toggle from '@/components/Toggle';

const Bar = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
`;

const Content = styled.div`
    white-space: pre-wrap;
    color: var(--color-secondary-foreground);
    border-left: 2px solid var(--color-default-border);
    padding-left: .5em;
    margin-top: .5em;
    margin-left: .5em;
`;

const Layout = styled.div`
    font-size: .8em;
`;

export interface Props {
    icon: ReactElement;
    title: string;
    content: string;
}

export default function SecondaryActBar({icon, title, content}: Props) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <Layout>
            <Bar>
                {icon}
                {title}
                <Toggle collapsed={collapsed} onChange={setCollapsed} />
            </Bar>
            {!collapsed && <Content>{content.trim()}</Content>}
        </Layout>
    );
}
