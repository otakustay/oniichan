import {createContext, use} from 'react';
import type {ReactNode} from 'react';
import {extractFileEdits} from '@oniichan/shared/inbox';
import type {RoundtripMessageData} from '@oniichan/shared/inbox';
import {mergeFileEdits} from '@oniichan/shared/patch';
import type {FileEditData} from '@oniichan/shared/patch';

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
    const edits = extractFileEdits(roundtrip.responses);

    return <Context value={{isEditInteractive, edits}}>{children}</Context>;
}

export function useAllMergedFileEdits(): FileEditData[] {
    const {edits} = use(Context);
    return Object.values(edits).filter(v => !!v).map(mergeFileEdits);
}

export function useIsEditInteractive() {
    const {isEditInteractive} = use(Context);
    return isEditInteractive;
}
