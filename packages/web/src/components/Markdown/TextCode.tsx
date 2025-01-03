import {Suspense} from 'react';
import styled from '@emotion/styled';
import {CopyCode} from './CopyCode';
import SourceCode from './SourceCode';
import LanguageIcon from './LanguageIcon';

const Header = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: .5em;
    align-items: center;
    justify-content: space-between;
    height: 2.5em;
    padding: 0 1em;
    border-radius: .5em .5em 0 0;
    border: 1px solid var(--color-default-border);
    border-bottom: none;
    background-color: var(--color-contrast-background);
`;

const Layout = styled.div`
    margin: 0;
    overflow: hidden;

    pre {
        margin: 0;
        padding: 0;
    }

    code {
        all: unset;
    }
`;

interface Props {
    code: string;
    language: string | undefined;
    closed: boolean;
}

export default function TextCode({code, language, closed}: Props) {
    return (
        <Layout>
            <Header>
                <LanguageIcon language={language ?? ''} />
                {language}
                {closed && <CopyCode text={code + '\n'} />}
            </Header>
            <Suspense fallback={<SourceCode.NoHighlight code={code} language={language} />}>
                <SourceCode code={code} language={language} />
            </Suspense>
        </Layout>
    );
}
