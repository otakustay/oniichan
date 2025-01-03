import {ReactElement, Suspense} from 'react';
import styled from '@emotion/styled';
import {getIcon} from 'material-file-icons';
import {CopyCode} from './CopyCode';
import {sampleFileNameFromLanguage} from './language';
import SourceCode from './SourceCode';

interface LanguageTypeIconProps {
    language: string;
}

function LanguageTypeIcon({language}: LanguageTypeIconProps) {
    const icon = getIcon(sampleFileNameFromLanguage(language));

    return <i style={{width: 14, height: 14}} dangerouslySetInnerHTML={{__html: icon.svg}} />;
}

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

interface CodeInPreProps {
    className?: string;
    children?: string;
}

interface CodeInPreElement {
    type: 'code';
    props: CodeInPreProps;
}

interface Props {
    children: ReactElement;
}

function isCodeElement(element: any): element is CodeInPreElement {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return element?.type === 'code';
}

export default function CodeBlock({children}: Props) {
    if (!isCodeElement(children)) {
        return children;
    }

    const {className, children: code = ''} = children.props;
    const matches = /language-(\w+)(:(\S+)+)?/.exec(className ?? '');
    const language = matches?.at(1);
    const file = matches?.at(3);

    return (
        <Layout>
            <Header>
                <LanguageTypeIcon language={language ?? ''} />
                {file ?? language}
                <CopyCode text={code + '\n'} />
            </Header>
            <Suspense fallback={<SourceCode.NoHighlight code={code} language={language} />}>
                <SourceCode code={code} language={language} />
            </Suspense>
        </Layout>
    );
}
