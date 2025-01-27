import {useState} from 'react';
import styled from '@emotion/styled';
import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';
import {trimPathString} from '@oniichan/shared/string';
import SourceCode from '@/components/SourceCode';
import Markdown from '@/components/Markdown';
import Toggle from '@/components/Toggle';

const FileNameLabel = styled.span`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

const ActionSection = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: .5em;
`;

const Bar = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
`;

const ItemLayout = styled.div`
    padding: .5em 1em;
    margin: 1em 0;
    border: solid 1px var(--color-default-border);
    border-radius: .5em;
    background-color: var(--color-contrast-background);

    + & {
        margin-top: 0;
    }
`;

interface ItemProps {
    item: EmbeddingSearchResultItem;
}

function Item({item}: ItemProps) {
    const [showSource, setShowSource] = useState(false);
    return (
        <ItemLayout>
            <Bar>
                <FileNameLabel title={item.file}>{trimPathString(item.file)}</FileNameLabel>
                <ActionSection>
                    <Toggle collapsed={showSource} onChange={setShowSource} />
                </ActionSection>
            </Bar>
            {showSource && <SourceCode code={item.content} language="diff" />}
        </ItemLayout>
    );
}

interface Props {
    query: string;
    results: EmbeddingSearchResultItem[];
}

export function EmbeddingSearch({query, results}: Props) {
    if (!results.length) {
        return <Markdown content="⚠️ No results found from embedding" />;
    }

    return (
        <>
            <Markdown content={`Embedding search for: ${query}`} />
            {results.map(item => <Item key={`${item.file}-${item.startLine}-${item.endLine}`} item={item} />)}
        </>
    );
}
