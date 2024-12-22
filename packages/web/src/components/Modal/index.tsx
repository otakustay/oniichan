import {ReactNode} from 'react';
import styled from '@emotion/styled';

interface Props {
    children: ReactNode;
    closeOnMaskClick?: boolean;
    onClose: () => void;
}

const Mask = styled.div`
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 9;
    background-color: var(--color-modal-mask);
`;

const Container = styled.div`
    background-color: var(--color-root-background);
`;

export default function Modal({children, closeOnMaskClick = true, onClose}: Props) {
    return (
        <Mask onMouseUp={closeOnMaskClick ? onClose : () => {}}>
            <Container onMouseUp={e => e.stopPropagation()}>
                {children}
            </Container>
        </Mask>
    );
}
