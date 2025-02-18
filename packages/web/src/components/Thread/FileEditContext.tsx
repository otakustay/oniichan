import {createContext, ReactNode, useContext} from 'react';
import {useOriginalDeepCopy} from 'huse';
import {MessageData, RoundtripMessageData} from '@oniichan/shared/inbox';
import {FileEditData} from '@oniichan/shared/patch';

function getFileEditFromMessage(message: MessageData): FileEditData[] {
    if (message.type !== 'toolCall') {
        return [];
    }

    const toolCall = message.chunks.find(v => v.type == 'toolCall');
    return toolCall?.fileEdit ? [toolCall.fileEdit] : [];
}

const Context = createContext<Record<string, FileEditData[] | undefined>>({});
Context.displayName = 'FileEditContext';

interface Props {
    roundtrip: RoundtripMessageData;
    children: ReactNode;
}

export default function FileEditContextProvider({roundtrip, children}: Props) {
    const edits: Record<string, FileEditData[] | undefined> = {};
    const allEdits = roundtrip.messages.flatMap(getFileEditFromMessage);
    for (const edit of allEdits) {
        const fileEdits = edits[edit.file] ?? [];
        fileEdits.push(edit);
        edits[edit.file] = fileEdits;
    }

    return <Context value={edits}>{children}</Context>;
}

export function useFileEditStack(file: string) {
    const edits = useContext(Context);
    return useOriginalDeepCopy(edits[file] ?? []);
}
