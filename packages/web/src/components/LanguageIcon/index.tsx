import {getIcon} from 'material-file-icons';
import {sampleFileNameFromExtension, sampleFileNameFromLanguage} from './language';

interface Props {
    mode: 'language' | 'extension';
    value: string | undefined;
}

export default function LanguageIcon({mode, value}: Props) {
    const iconName = mode === 'language' ? sampleFileNameFromLanguage(value) : sampleFileNameFromExtension(value);
    const icon = getIcon(iconName);

    return <i style={{width: 14, height: 14}} dangerouslySetInnerHTML={{__html: icon.svg}} />;
}
