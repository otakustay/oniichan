import type {CSSProperties, ReactNode} from 'react';
import styled from '@emotion/styled';

export interface Props {
    style?: CSSProperties;
    type?: 'button' | 'submit';
    className?: string;
    disabled?: boolean;
    children: ReactNode;
    onClick?: () => void;
}

const Layout = styled.button`
    appearance: none;
    border: none;
    padding: 0 1em;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
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

export default function Button({style, type = 'button', className, disabled, children, onClick}: Props) {
    return (
        <Layout type={type} disabled={disabled} onClick={onClick} style={style} className={className}>
            {children}
        </Layout>
    );
}
