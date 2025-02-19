import {atom, useAtomValue} from 'jotai';

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

        const {default: Fuse} = await import('fuse.js');
        const fuse = new Fuse(files);
        return fuse.search(pattern, {limit: 10}).map(v => ({id: v.item, display: v.item}));
    };
}
