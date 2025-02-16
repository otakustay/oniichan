import {IoChatbubbleEllipsesOutline} from 'react-icons/io5';
import ActBar from '@/components/ActBar';
import Markdown from '@/components/Markdown';

interface Props {
    content: string;
}

export default function Reasoning({content}: Props) {
    // TODO: Add some small text change by time
    return (
        <ActBar
            icon={<IoChatbubbleEllipsesOutline />}
            content="Oniichan is burning his brain..."
            richContent={<Markdown content={content} />}
        />
    );
}
