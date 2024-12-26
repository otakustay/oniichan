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
    border: none;
    padding: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
    color: var(--color-interactive-foreground);
    background-color: var(--color-interactive-background);

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
    return (
        <Layout disabled={disabled} onClick={onClick} className={className}>
            {children}
        </Layout>
    );
}
