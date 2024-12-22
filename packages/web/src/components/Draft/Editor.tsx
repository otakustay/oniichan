import {ChangeEvent, KeyboardEvent} from 'react';
import styled from '@emotion/styled';
import {useDraftContentValue, useSetDraftContent} from '@/atoms/draft';

const EditArea = styled.textarea`
    width: 100%;
    height: 100%;
    resize: none;
    outline: none;
    border: none;
    padding: 1em 0;
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
        if (e.code === 'Tab') {
            e.preventDefault();
            const element = e.target as HTMLTextAreaElement;
            const {selectionStart, selectionEnd} = element;
            const newValue = element.value.slice(0, selectionStart) + '  ' + element.value.slice(selectionEnd);
            element.value = newValue;
            setDraftContent(newValue);
        }
        else if (e.code === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
