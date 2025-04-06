import {useSetEditing} from '@oniichan/web-host/atoms/draft';
import {useKeyboardShortcut} from '@/hooks/keyboard';
import ThreadList from './ThreadList';
import Body from './Body';
import Navigation from './Navigation';

function Inbox() {
    const setEditing = useSetEditing();
    useKeyboardShortcut(
        {key: 'n', shift: true},
        () => {
            setEditing({mode: 'new', threadUuid: crypto.randomUUID()});
        }
    );
    return (
        <>
            <Navigation />
            <Body />
        </>
    );
}

export default Object.assign(Inbox, {Header: Navigation, List: ThreadList});
