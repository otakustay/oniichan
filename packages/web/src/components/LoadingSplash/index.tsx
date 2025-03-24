import {useEffect, useState} from 'react';
import {HashLoader} from 'react-spinners';
import Inbox from '@/components/Inbox';

export default function LoadingSplash() {
    const [render, setRender] = useState(false);
    useEffect(
        () => {
            const timer = setTimeout(() => setRender(true), 500);
            return () => {
                clearTimeout(timer);
            };
        }
    );

    return (
        <>
            <Inbox.Header />
            {render && <HashLoader color="var(--color-information)" loading={true} size="150px" />}
        </>
    );
}
