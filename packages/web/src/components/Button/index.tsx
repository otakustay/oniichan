import {ReactNode} from 'react';
import styled from '@emotion/styled';

interface Props {
    className?: string;
    disabled?: boolean;
    children: ReactNode;
    onClick?: () => void;
}

const Background = styled.button`
    appearance: none;
    border: none;
    color: var(--color-interactive-foreground);
    background-color: var(--color-interactive-background);
    padding: 0;
    overflow: hidden;
`;

const Layout = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
    background-color: transparent;

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
        <Background disabled={disabled} onClick={onClick} className={className}>
            <Layout>{children}</Layout>
        </Background>
    );
}
