import {HTMLAttributes} from 'react';
import styled from '@emotion/styled';

const Layout = styled.span`
    color: ${props => `var(--color-${props.onClick ? 'link' : 'default'}-foreground)`};
    cursor: ${props => (props.onClick ? 'pointer' : 'default')};

    &:hover {
        color: ${props => props.onClick ? 'var(--color-link-foreground-hover)' : 'default'};
    }

    &:active {
        color: ${props => props.onClick ? 'var(--color-link-foreground-active)' : 'default'};
    }
`;

export default function InteractiveLabel(props: HTMLAttributes<HTMLSpanElement>) {
    return <Layout {...props} />;
}
