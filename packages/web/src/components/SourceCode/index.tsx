import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {getSingletonHighlighter} from 'shiki';
import type {BundledHighlighterOptions, BundledLanguage, BundledTheme, HighlighterGeneric} from 'shiki';
import {useColorScheme} from '@/components/AppProvider';

const Layout = styled.div`
    overflow-x: auto;

    pre {
        margin: 0;
        /* Override shiki's inline style */
        background-color: transparent !important;
    }

    code {
        background: transparent;
    }
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
                    themes: [
                        'github-light-default',
                        'github-dark-default',
                    ],
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
            defaultColor: false,
        }
    );

    return <Layout dangerouslySetInnerHTML={{__html: html}} />;
}

export default Object.assign(SourceCode, {NoHighlight});
