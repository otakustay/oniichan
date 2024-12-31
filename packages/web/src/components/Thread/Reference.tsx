import styled from '@emotion/styled';
import {IoDocumentTextOutline, IoFolderOpenOutline} from 'react-icons/io5';
import {MessageReference} from '@oniichan/shared/inbox';

const Layout = styled.div`
    display: flex;
    gap: .5em;
    font-size: .8em;
    flex-wrap: wrap;
    margin-top: 1em;
`;

const Label = styled.span`
    display: inline-flex;
    gap: .5em;
    height: 2em;
    align-items: center;
    background-color: var(--color-contrast-background);
    color: var(--color-contrast-foreground);
    border: 1px solid var(--color-default-border);
    border-radius: .3em;
    padding: 0 .5em;
    cursor: default;
`;

function trimPathString(path: string) {
    if (path.length <= 20) {
        return path;
    }

    const segments = path.split(/([/\\])/);
    const before = segments.slice(0, 4).join('');
    const last = segments.slice(-2).join('');
    return `${before}...${last}`;
}

interface Props {
    references: MessageReference[];
}

export default function Reference({references}: Props) {
    const renderLabel = (reference: MessageReference) => (
        <Label>
            {reference.type === 'file' && <IoDocumentTextOutline />}
            {reference.type === 'directory' && <IoFolderOpenOutline />}
            {trimPathString(reference.path)}
        </Label>
    );

    return (
        <Layout>
            {references.map(renderLabel)}
        </Layout>
    );
}
