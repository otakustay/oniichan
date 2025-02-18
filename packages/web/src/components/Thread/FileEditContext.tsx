import {createContext, ReactNode, useContext} from 'react';
import {useOriginalDeepCopy} from 'huse';
import {RoundtripMessageData, extractFileEdits} from '@oniichan/shared/inbox';
import {FileEditData} from '@oniichan/shared/patch';

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

export function useFileEditStack(file: string) {
    const {edits} = useContext(Context);
    return useOriginalDeepCopy(edits[file] ?? []);
}

export function useIsEditInteractive() {
    const {isEditInteractive} = useContext(Context);
    return isEditInteractive;
}
