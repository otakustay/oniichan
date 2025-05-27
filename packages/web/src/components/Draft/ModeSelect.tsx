import {useState} from 'react';
import type {ReactElement} from 'react';
import styled from '@emotion/styled';
import {SiCircle} from 'react-icons/si';
import {RiHeartsLine} from 'react-icons/ri';
import {IoSwapHorizontalOutline} from 'react-icons/io5';
import {FaUserCheck} from 'react-icons/fa';
import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import Avatar from '@/components/Avatar';
import Rating from '@/components/Rating';
import {stringifyWorkingMode} from './utils';

interface ModeDescription {
    speed: number;
    quality: number;
    cost: number;
    standard: string;
    text: string;
}

const DESCRIPTION_BY_MODE: Record<MessageThreadWorkingMode, ModeDescription> = {
    normal: {
        speed: 4,
        quality: 5,
        cost: 5,
        standard: 'Claude (default)',
        text: 'Single model works step by step.',
    },
    ringRing: {
        speed: 1,
        quality: 5,
        cost: 3,
        standard: 'R1 (planner) + V3 (actor) + Claude (coder)',
        text: 'Plan driven quality oriented, best for complex task.',
    },
    couple: {
        speed: 4,
        quality: 3,
        cost: 2,
        standard: 'V3 (actor) + Claude (coder)',
        text: 'Only use coder model in file edit, cost friendly.',
    },
    henshin: {
        speed: 3,
        quality: 4,
        cost: 3,
        standard: 'V3 (actor) + Claude (coder)',
        text: 'Actor transforms to coder when coding task appears, write better code than couple mode.',
    },
    senpai: {
        speed: 3,
        quality: 5,
        cost: 5,
        standard: 'V3 (actor) + V3 (reviewer)',
        text: 'Reviewer helps to check the result of task to seize better quality.',
    },
};

const ModeList = styled.ul`
    padding: .5em 0;
    margin: 0;
    list-style: none;
    width: 15em;
`;

const ModeItem = styled.li`
    width: 100%;
    display: flex;
    height: 1.5em;
    align-items: center;
    gap: .5em;
    padding: 0 .5em;
    color: var(--color-default-foreground);
    cursor: pointer;

    &:hover {
        background-color: var(--color-interactive-background-hover);
        color: var(--color-interactive-foreground);
    }

    &:active {
        background-color: var(--color-interactive-background-active);
        color: var(--color-interactive-foreground);
    }
`;

const PerformanceItem = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 4em 1fr;
    align-items: center;
    height: 1.5em;
`;

const Description = styled.p`
    margin: 0;
    font-size: .8em;
    color: var(--color-secondary-foreground);
`;

const PerformanceStandard = styled(Description)`
    text-align: right;
    font-size: .6em;

    &::before {
        content: "*";
    }
`;

const Explain = styled.div`
    position: absolute;
    top: 0;
    left: 100%;
    padding: .5em;
    padding-left: 1em;
    color: var(--color-default-foreground);
    background-color: var(--color-default-background);


    @media (max-width: 510px) {
        top: 100%;
        left: 0;
        padding-left: .5em;
    }
`;

interface ItemProps {
    icon: ReactElement;
    workingMode: MessageThreadWorkingMode;
    onSelect: (value: MessageThreadWorkingMode) => void;
    onHover: (value: MessageThreadWorkingMode) => void;
    onLeave: () => void;
}

function Item({icon, workingMode, onSelect, onHover, onLeave}: ItemProps) {
    return (
        <ModeItem
            onClick={() => onSelect(workingMode)}
            onMouseEnter={() => onHover(workingMode)}
            onMouseLeave={onLeave}
        >
            {icon}
            {stringifyWorkingMode(workingMode)}
        </ModeItem>
    );
}

interface Props {
    onSelect: (mode: MessageThreadWorkingMode) => void;
}

export default function ModeSelect({onSelect}: Props) {
    const [hover, setHover] = useState<MessageThreadWorkingMode | null>(null);
    const description = DESCRIPTION_BY_MODE[hover ?? 'normal'];
    const leave = () => setHover(null);

    return (
        <>
            <ModeList>
                <Item
                    icon={<Avatar.Assistant />}
                    workingMode="normal"
                    onSelect={onSelect}
                    onHover={setHover}
                    onLeave={leave}
                />
                <Item
                    icon={<RiHeartsLine />}
                    workingMode="couple"
                    onSelect={onSelect}
                    onHover={setHover}
                    onLeave={leave}
                />
                <Item
                    icon={<IoSwapHorizontalOutline />}
                    workingMode="henshin"
                    onSelect={onSelect}
                    onHover={setHover}
                    onLeave={leave}
                />
                <Item
                    icon={<SiCircle />}
                    workingMode="ringRing"
                    onSelect={onSelect}
                    onHover={setHover}
                    onLeave={leave}
                />
                <Item
                    icon={<FaUserCheck />}
                    workingMode="senpai"
                    onSelect={onSelect}
                    onHover={setHover}
                    onLeave={leave}
                />
            </ModeList>
            <Explain style={{display: hover ? 'initial' : 'none'}}>
                <PerformanceItem>
                    Speed
                    <Rating max={5} value={description.speed} />
                </PerformanceItem>
                <PerformanceItem>
                    Quality
                    <Rating max={5} value={description.quality} />
                </PerformanceItem>
                <PerformanceItem>
                    Cost
                    <Rating max={5} value={description.cost} />
                </PerformanceItem>
                <PerformanceStandard>{description.standard}</PerformanceStandard>
                <Description>{description.text}</Description>
            </Explain>
        </>
    );
}
