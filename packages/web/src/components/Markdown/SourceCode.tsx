import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {
    BundledHighlighterOptions,
    BundledLanguage,
    BundledTheme,
    getSingletonHighlighter,
    HighlighterGeneric,
} from 'shiki';
import {useColorScheme} from '@/components/AppProvider';

const Layout = styled.div`
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
    const [highlighter, setHighlighter] = useState<HighlighterGeneric<BundledLanguage, BundledTheme> | null>(null);
    const colorScheme = useColorScheme();
    useEffect(
        () => {
            if (!language) {
                return;
            }

            void (async () => {
                const options: BundledHighlighterOptions<BundledLanguage, BundledTheme> = {
                    langs: [language],
                    themes: ['github-light-default', 'github-dark-default'],
                };
                const highlighter = await getSingletonHighlighter(options).catch(() => null);
                setHighlighter(highlighter);
            })();
        },
        [language]
    );

    if (!language || !highlighter) {
        return <NoHighlight code={code} language={language} />;
    }

    const html = highlighter.codeToHtml(
        code,
        {
            lang: language,
            theme: colorScheme === 'light' ? 'github-light-default' : 'github-dark-default',
        }
    );

    return <Layout dangerouslySetInnerHTML={{__html: html}} />;
}

export default Object.assign(SourceCode, {NoHighlight});
