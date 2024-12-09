import ClientProvider from '@/components/ClientProvider';
import ModelTelemetry from '../ModelTelemetry';

export default function App() {
    return (
        <ClientProvider>
            <ModelTelemetry />
        </ClientProvider>
    );
}
