import ThreadList from './ThreadList';
import Body from './Body';
import Navigation from './Navigation';

function Inbox() {
    return (
        <>
            <Navigation />
            <Body />
        </>
    );
}

export default Object.assign(Inbox, {Header: Navigation, List: ThreadList});
