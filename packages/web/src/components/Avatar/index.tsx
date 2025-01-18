import styled from '@emotion/styled';
import userSrc from './user.png';
import assistantSrc from './assistant.png';
import toolSrc from './tool.png';

interface SizeProps {
    size?: string;
}

interface Props extends SizeProps {
    src: string;
}

const Layout = styled.img<SizeProps>`
    width: ${props => props.size ?? '1em'};
    height: ${props => props.size ?? '1em'};
    border-radius: 50%;
`;

export default function Avatar({src, size}: Props) {
    return <Layout src={src} size={size} />;
}

Avatar.User = function UserAvatar({size}: SizeProps) {
    return <Layout src={userSrc} size={size} />;
};

Avatar.Assistant = function AssistantAvatar({size}: SizeProps) {
    return <Layout src={assistantSrc} size={size} />;
};

Avatar.Tool = function ToolAvatar({size}: SizeProps) {
    return <Layout src={toolSrc} size={size} />;
};
