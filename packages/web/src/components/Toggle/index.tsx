import {IoCaretDown} from 'react-icons/io5';
import styled from '@emotion/styled';
import {motion} from 'motion/react';

const Layout = styled(motion.i)`
    width: 1em;
    height: 1em;
`;

interface Props {
    collapsed: boolean;
    onChange: (collapsed: boolean) => void;
}

export default function Toggle({collapsed, onChange}: Props) {
    return (
        <Layout animate={{rotate: collapsed ? 0 : -180}} onClick={() => onChange(!collapsed)}>
            <IoCaretDown />
        </Layout>
    );
}
