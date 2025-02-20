import {atom, useAtomValue} from 'jotai';
import {Fuzzy} from '@nexucis/fuzzy';

const fuzzy = new Fuzzy({shouldSort: true, shouldRender: false});

export interface WorkspaceState {
    current: string | null;
    files: string[];
}

interface SearchResult {
    id: string;
    display: string;
}

export const workspaceFilesAtom = atom<WorkspaceState>({current: null, files: []});

export function useSearchWorkspaceFiles() {
    const {current, files} = useAtomValue(workspaceFilesAtom);
    return async (pattern: string): Promise<SearchResult[]> => {
        if (!pattern.trim()) {
            return current ? [{id: current, display: `[Current] ${current}`}] : [];
        }

        return fuzzy.filter(pattern, files).slice(0, 10).map(v => ({id: v.original, display: v.original}));
    };
}
