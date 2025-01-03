import {getIcon} from 'material-file-icons';
import {sampleFileNameFromLanguage} from './language';

interface Props {
    language: string;
}

export default function LanguageIcon({language}: Props) {
    const icon = getIcon(sampleFileNameFromLanguage(language));

    return <i style={{width: 14, height: 14}} dangerouslySetInnerHTML={{__html: icon.svg}} />;
}
