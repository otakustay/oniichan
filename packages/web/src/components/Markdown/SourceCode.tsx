import {use} from 'react';
import styled from '@emotion/styled';
import {codeToHtml} from 'shiki';

function renderCode(code: string, language: string) {
    return codeToHtml(
        code,
        {
            lang: language,
            themes: {light: 'github-light-default', dark: 'github-dark-default'},
        }
    );
}

const Layout = styled.div`
    border: 1px solid var(--color-default-border);
    padding: .5em;
    overflow-x: auto;
`;

interface Props {
    code: string;
    language: string | undefined;
}

function NoHighlight({code}: Props) {
    return (
        <Layout>
            <pre>{code}</pre>
        </Layout>
    );
}

function SourceCode({code, language}: Props) {
    if (!language) {
        return <NoHighlight code={code} language={language} />;
    }

    const html = use(renderCode(code, language));

    return <Layout dangerouslySetInnerHTML={{__html: html}} />;
}

export default Object.assign(SourceCode, {NoHighlight});
