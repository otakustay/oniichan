import styled from '@emotion/styled';
import ThreadList from './ThreadList';
import MainContent from './MainContent';
import {mediaWideScreen} from '@/styles';

const Layout = styled.div`
    height: calc(100vh - 4em);

    @media (${mediaWideScreen}) {
        display: grid;
        grid-template-columns: 30% 1fr;
    }
`;

export default function Body() {
    return (
        <>
            <Layout>
                <ThreadList />
                <MainContent />
            </Layout>
        </>
    );
}
