import {IoGlobeOutline} from 'react-icons/io5';
import ActBar from '@/components/ActBar';
import {useIpc} from '@/components/AppProvider';

const {ActionButton} = ActBar;

interface Props {
    url: string;
    closed: boolean;
}

export default function PreviewUrl({url, closed}: Props) {
    const ipc = useIpc();
    const openPreview = async () => {
        await ipc.editor.call(crypto.randomUUID(), 'openUrl', url);
    };

    return (
        <ActBar
            icon={<IoGlobeOutline />}
            content={url}
            actions={closed && <ActionButton onClick={openPreview}>Open</ActionButton>}
        />
    );
}
