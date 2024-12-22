import {ReactNode} from 'react';
import styled from '@emotion/styled';

interface Props {
    className?: string;
    disabled?: boolean;
    children: ReactNode;
    onClick?: () => void;
}

const Layout = styled.button`
    appearance: none;
    cursor: pointer;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-interactive-background);
    color: var(--color-interactive-foreground);

    :hover:not(:disabled) {
        background-color: var(--color-interactive-background-hover);
    }

    :active:not(:disabled) {
        background-color: var(--color-interactive-background-active);
    }

    :disabled {
        background-color: var(--color-interactive-background-disabled);
        color: var(--color-interactive-foreground-disabled);
        cursor: not-allowed;
    }
`;

export default function Button({className, disabled, children, onClick}: Props) {
    return <Layout disabled={disabled} className={className} onClick={onClick}>{children}</Layout>;
}
