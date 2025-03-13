import type {CSSProperties} from 'react';
import styled from '@emotion/styled';
import {IoInformationCircleOutline, IoWarningOutline, IoAlertCircleOutline} from 'react-icons/io5';

interface TypeProps {
    type: 'information' | 'warn' | 'error';
}

const Layout = styled.div<TypeProps>`
    background-color: var(--color-${props => props.type});
    color: var(--color-notification-foreground);
    border-radius: .5em;
    display: flex;
    align-items: center;
    gap: .5em;
    padding: .5em 1em;
`;

interface Props extends TypeProps {
    className?: string;
    style?: CSSProperties;
    message: string;
}

export function Alert({className, style, message, type}: Props) {
    const icon = type === 'information'
        ? <IoInformationCircleOutline />
        : (type === 'warn' ? <IoWarningOutline /> : <IoAlertCircleOutline />);

    return (
        <Layout className={className} style={style} type={type}>
            {icon}
            {message}
        </Layout>
    );
}
