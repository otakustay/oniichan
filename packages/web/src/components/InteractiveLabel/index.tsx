import {ElementType, HTMLAttributes} from 'react';
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

interface Props extends HTMLAttributes<HTMLElement> {
    as?: ElementType;
}

export default function InteractiveLabel({as, ...props}: Props) {
    return <Layout as={as} {...props} />;
}
