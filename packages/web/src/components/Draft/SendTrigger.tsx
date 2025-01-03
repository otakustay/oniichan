import styled from '@emotion/styled';
import {FiSend} from 'react-icons/fi';
import Button from '@/components/Button';

const Layout = styled(Button)`
    border-radius: 50%;
    width: 2em;
    height: 2em;
    padding: 0;
`;

interface Props {
    disabled: boolean;
    onClick: () => void;
}

export default function SendTrigger({disabled, onClick}: Props) {
    return (
        <Layout disabled={disabled} onClick={onClick}>
            <FiSend />
        </Layout>
    );
}
