/**
 * Web 端入口文件，负责初始化 React 应用
 *
 * 应用的整体结构为：
 * - AppProvider：提供全局状态和上下文
 * - App：主应用组件
 * - LoadingSplash：应用初始化时的加载状态
 */
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
