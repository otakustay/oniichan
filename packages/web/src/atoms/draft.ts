import {atom, useAtomValue, useSetAtom} from 'jotai';

const draftContentAtom = atom('');

export interface EditingValue {
    threadUuid: string;
    mode: 'new' | 'reply';
}

export const editingAtom = atom<EditingValue | null>(null);

export function useDraftContentValue() {
    return useAtomValue(draftContentAtom);
}

export function useSetDraftContent() {
    const setContent = useSetAtom(draftContentAtom);
    return setContent;
}

export function useEditingValue() {
    return useAtomValue(editingAtom);
}

export function useSetEditing() {
    const setEditing = useSetAtom(editingAtom);
    return setEditing;
}
