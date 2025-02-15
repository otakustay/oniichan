import styled from '@emotion/styled';
import {motion} from 'motion/react';
import {createPortal} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {IoInformationCircleOutline, IoWarningOutline, IoAlertCircleOutline} from 'react-icons/io5';

interface TypeProps {
    type: 'information' | 'warn' | 'error';
}

const Layout = styled(motion.div)<TypeProps>`
    position: fixed;
    right: 2em;
    bottom: 2em;
    background-color: var(--color-${props => props.type});
    color: var(--color-notification-foreground);
    border-radius: 1em;
    display: flex;
    align-items: center;
    gap: .5em;
    padding: 1em;
`;

interface Props extends TypeProps {
    message: string;
}

export function Toast({type, message}: Props) {
    const icon = type === 'information'
        ? <IoInformationCircleOutline />
        : (type === 'warn' ? <IoWarningOutline /> : <IoAlertCircleOutline />);

    return createPortal(
        <Layout
            type={type}
            initial={{translateX: 'calc(100% + 2em)'}}
            animate={{translateX: 0}}
            transition={{ease: 'easeInOut'}}
            exit={{translateX: 'calc(100% + 2em)'}}
        >
            {icon}
            {message}
        </Layout>,
        document.body
    );
}

function ensureContainer(id: string) {
    const container = document.getElementById(id);

    if (container) {
        return container;
    }

    const newContainer = document.createElement('div');
    newContainer.id = id;
    document.body.appendChild(newContainer);
    return newContainer;
}

export interface ToastOptions {
    timeout: number;
}

export function showToast(type: Props['type'], message: string, options: ToastOptions) {
    const containerId = 'oniichan-toast-container';
    const container = ensureContainer(containerId);
    const toast = createRoot(container);
    toast.render(<Toast type={type} message={message} />);
    setTimeout(
        () => {
            toast.unmount();
        },
        options.timeout
    );
}
