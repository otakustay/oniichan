import Thread from '@/components/Thread';
import Inbox from '@/components/Inbox';
import Draft from '@/components/Draft';
import {useActiveMessageThreadValue} from '@oniichan/web-host/atoms/inbox';

function Body() {
    const activeThread = useActiveMessageThreadValue();

    if (activeThread) {
        return <Thread uuid={activeThread.uuid} />;
    }

    return <Inbox />;
}

export default function App() {
    return (
        <>
            <Body />
            <Draft />
        </>
    );
}
