import styled from '@emotion/styled';
import {AiOutlineLoading3Quarters} from 'react-icons/ai';

const LoadingIcon = styled(AiOutlineLoading3Quarters)`
    animation: spin 1s linear infinite;

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

export default LoadingIcon;
