import {ChangeEvent, KeyboardEvent} from 'react';
import styled from '@emotion/styled';
import {useDraftContentValue, useSetDraftContent} from '@oniichan/web-host/atoms/draft';

const EditArea = styled.textarea`
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

interface Props {
    onSend: () => void;
}

export default function Editor({onSend}: Props) {
    const content = useDraftContentValue();
    const setDraftContent = useSetDraftContent();
    const updateContent = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setDraftContent(e.target.value);
    };
    const edit = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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

    return (
        <EditArea
            autoFocus
            value={content}
            onChange={updateContent}
            onKeyDown={edit}
        />
    );
}
