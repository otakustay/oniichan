import {ReactElement, ReactNode, useState} from 'react';
import styled from '@emotion/styled';
import {css} from '@emotion/react';
import Toggle from '@/components/Toggle';

interface ModeProps {
    mode?: 'default' | 'contrast';
}

const barStyle = css`
    display: flex;
    align-items: center;
    gap: .5em;
`;

const createWrppaerStyle = (props: ModeProps) => {
    return css`
        padding: .5em 1em;
        margin: 1em 0;
        border: solid 1px var(--color-default-border);
        border-radius: .5em;
        background-color: ${props.mode === 'contrast' ? 'var(--color-contrast-background)' : ''};

        + & {
            margin-top: 0;
        }
    `;
};

const ActionSection = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: .5em;
`;

const Bar = styled.div`
    ${barStyle};
`;

const RichLayout = styled.div<ModeProps>`
    ${props => createWrppaerStyle(props)};
`;

const Layout = styled.div<ModeProps>`
    ${barStyle};
    ${props => createWrppaerStyle(props)}
`;

interface Props extends ModeProps {
    icon: ReactElement;
    content: ReactNode;
    actions?: ReactElement;
    richContent?: ReactElement | null | undefined | false;
}

function ActBar({icon, content, actions, richContent, mode}: Props) {
    const [expanded, setExpanded] = useState(false);

    if (richContent) {
        return (
            <RichLayout mode={mode}>
                <Bar>
                    {icon}
                    {content}
                    <ActionSection>
                        {actions}
                        <Toggle collapsed={expanded} onChange={setExpanded} />
                    </ActionSection>
                </Bar>
                {expanded && richContent}
            </RichLayout>
        );
    }

    return (
        <Layout mode={mode}>
            {icon}
            {content}
            {actions && <ActionSection>{actions}</ActionSection>}
        </Layout>
    );
}

export default Object.assign(ActBar, {Layout});
