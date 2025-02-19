import {useEffect, useRef} from 'react';
import styled from '@emotion/styled';
import {MentionsInput, Mention, SuggestionDataItem} from 'react-mentions';
import {useSearchWorkspaceFiles} from '@oniichan/web-host/atoms/workspace';
import {useDraftContentValue, useSetDraftContent} from '@oniichan/web-host/atoms/draft';
import mentionStyle from './mentionStyle';

const EditArea = styled(MentionsInput)`
    width: 100%;
    height: 100%;
    resize: none;
    border: none;
    padding: .5em;
    background-color: transparent;

    &:focus {
        outline: none;
    }
`;

interface InputTarget {
    value: string;
}

interface MentionChangeEvent {
    target: InputTarget;
}

interface Props {
    onSend: () => void;
}

export default function Editor({onSend}: Props) {
    const content = useDraftContentValue();
    const setDraftContent = useSetDraftContent();
    const searchWorkspaceFiles = useSearchWorkspaceFiles();
    const fuzzySearch = async (pattern: string, callback: (items: SuggestionDataItem[]) => void) => {
        try {
            const results = await searchWorkspaceFiles(pattern);
            callback(results);
        }
        catch {
            callback([]);
        }
    };
    // Don't use ref callback, it will be cleanup and re-create on every render
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(
        () => {
            if (!ref.current) {
                return;
            }

            const edit = (e: KeyboardEvent) => {
                const element = e.target as HTMLTextAreaElement;

                if (e.code === 'Tab') {
                    e.preventDefault();
                    const {selectionStart, selectionEnd} = element;
                    const newValue = element.value.slice(0, selectionStart) + '  ' + element.value.slice(selectionEnd);
                    element.value = newValue;
                    setDraftContent(newValue);
                }
                else if (e.code === 'Enter' && (e.ctrlKey || e.metaKey) && element.value.trim()) {
                    e.preventDefault();
                    onSend();
                    setDraftContent('');
                }
            };
            ref.current.addEventListener('keydown', edit, false);
            return () => {
                ref.current?.removeEventListener('keydown', edit);
            };
        },
        []
    );
    const updateContent = (e: MentionChangeEvent) => {
        setDraftContent(e.target.value);
    };

    return (
        <EditArea
            autoFocus
            allowSuggestionsAboveCursor
            value={content}
            onChange={updateContent}
            inputRef={ref}
            style={mentionStyle}
        >
            <Mention
                trigger={/(#([^#\s]*))$/}
                data={fuzzySearch}
                markup="#[file](__id__)"
                displayTransform={id => '`' + id + '`'}
            />
        </EditArea>
    );
}
