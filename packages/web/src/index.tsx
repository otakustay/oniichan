import {StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import '@/styles';
import App from '@/components/App';
import AppProvider from '@/components/AppProvider';
import LoadingSplash from '@/components/LoadingSplash';

const root = createRoot(document.body.appendChild(document.createElement('div')));
root.render(
    <StrictMode>
        <Suspense fallback={<LoadingSplash />}>
            <AppProvider>
                <App />
            </AppProvider>
        </Suspense>
    </StrictMode>
);
