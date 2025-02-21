import {createContext, ReactNode, useContext} from 'react';
import {RoundtripMessageData, extractFileEdits} from '@oniichan/shared/inbox';
import {FileEditData, mergeFileEdits} from '@oniichan/shared/patch';

interface ContextValue {
    edits: Record<string, FileEditData[] | undefined>;
    isEditInteractive: boolean;
}

const Context = createContext<ContextValue>({edits: {}, isEditInteractive: false});
Context.displayName = 'FileEditContext';

interface Props {
    roundtrip: RoundtripMessageData;
    isEditInteractive: boolean;
    children: ReactNode;
}

export default function FileEditContextProvider({roundtrip, isEditInteractive, children}: Props) {
    const edits = extractFileEdits(roundtrip.messages);

    return <Context value={{isEditInteractive, edits}}>{children}</Context>;
}

export function useMergedFileEdit(file: string): FileEditData | null {
    const {edits} = useContext(Context);
    return edits[file] ? mergeFileEdits(edits[file]) : null;
}

export function useAllMergedFileEdits(): FileEditData[] {
    const {edits} = useContext(Context);
    return Object.values(edits).filter(v => !!v).map(mergeFileEdits);
}

export function useIsEditInteractive() {
    const {isEditInteractive} = useContext(Context);
    return isEditInteractive;
}
