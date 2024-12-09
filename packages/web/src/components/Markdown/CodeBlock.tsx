import {useMemo} from 'react';
import styled from '@emotion/styled';
import {getIcon} from 'material-file-icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {docco} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {CopyCode} from './CopyCode';
import {sampleFileNameFromLanguage} from './language';

interface LanguageTypeIconProps {
    language: string;
}

function LanguageTypeIcon({language}: LanguageTypeIconProps) {
    const icon = getIcon(sampleFileNameFromLanguage(language));

    // bca-disable-line
    return <i style={{width: 14, height: 14}} dangerouslySetInnerHTML={{__html: icon.svg}} />;
}

const Header = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 12px;
    background-color: #343540;
`;

const Layout = styled.div`
    --source-text-color: #f8f8f3;
    --source-background-color: #000;

    margin: 0;
    font-size: 14px;
    background-color: var(--source-background-color);
    color: var(--source-text-color);
    border-radius: 4px;
    overflow: hidden;
`;

const SourceCode = styled(SyntaxHighlighter)`
    border: 1em solid transparent;
`;

interface Props {
    inline: boolean;
    className?: string;
    children: string[];
}

export default function CodeBlock({inline, className, children}: Props) {
    const code = useMemo(
        () => children.join('\n').trim(),
        [children]
    );
    const language = useMemo(
        () => /language-(\w+)/.exec(className ?? '')?.[1],
        [className]
    );

    if (inline) {
        return <code className={className}>{children}</code>;
    }

    return (
        <Layout>
            <Header>
                <LanguageTypeIcon language={language ?? ''} />
                {language}
                <CopyCode text={code + '\n'} />
            </Header>
            <SourceCode language={language} style={docco}>
                {code}
            </SourceCode>
        </Layout>
    );
}
