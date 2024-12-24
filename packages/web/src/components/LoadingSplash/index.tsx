import {useEffect, useState} from 'react';
import {HashLoader} from 'react-spinners';

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

    return render && <HashLoader color="var(--color-information)" loading={true} size="150px" />;
}
