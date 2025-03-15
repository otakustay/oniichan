import {useState, type ReactElement} from 'react';
import {SiCircle} from 'react-icons/si';
import styled from '@emotion/styled';
import {usePopper} from 'react-popper';
import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {assertNever} from '@oniichan/shared/error';
import {useSetWorkingMode, useWorkingModeSubmitValue} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue} from '@oniichan/web-host/atoms/draft';
import Avatar from '@/components/Avatar';

function stringifyWorkingMode(mode: MessageThreadWorkingMode) {
    switch (mode) {
        case 'normal':
            return 'Oniichan';
        case 'ringRing':
            return 'Oniichan (Ring Ring Mode)';
        default:
            assertNever<string>(mode, v => `Unknown working mode ${v}`);
    }
}

const Name = styled.span`
    appearance: none;
    width: fit-content;
    border: none;
    padding: 0 .5em;
    border-radius: .3em;
    cursor: default;

    &:hover {
        background-color: var(--color-interactive-background-hover);
        color: var(--color-interactive-foreground);
    }

    &:focus {
        outline: none;
        background-color: var(--color-interactive-background);
        color: var(--color-interactive-foreground);
    }

    &:active {
        outline: none;
        background-color: var(--color-interactive-background-active);
        color: var(--color-interactive-foreground);
    }
`;

const PopoverItem = styled.li`
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

const Popover = styled.ul`
    background-color: var(--color-default-background);
    padding: .5em 0;
    margin: 0;
    list-style: none;
    width: 15em;
    z-index: 1;
`;

const Layout = styled.div`
    display: flex;
    gap: 1em;
    align-items: center;
    color: #aaa;
    padding-bottom: 1em;
    border-bottom: 1px solid var(--color-default-border);
`;

interface ItemProps {
    icon: ReactElement;
    workingMode: MessageThreadWorkingMode;
    onSelect: (value: MessageThreadWorkingMode) => void;
}

function Item({icon, workingMode, onSelect}: ItemProps) {
    return (
        <PopoverItem onClick={() => onSelect(workingMode)}>
            {icon}
            {stringifyWorkingMode(workingMode)}
        </PopoverItem>
    );
}

export function Receiver() {
    const editing = useEditingValue();
    const workingMode = useWorkingModeSubmitValue();
    const setWorkingMode = useSetWorkingMode();
    const [open, setOpen] = useState(false);
    const [nameElement, setNameElement] = useState<HTMLSpanElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLUListElement | null>(null);
    const {styles, attributes, update} = usePopper(
        nameElement,
        popperElement,
        {
            placement: 'bottom-start',
            modifiers: [],
        }
    );
    const openPopover = async () => {
        setOpen(true);
        await update?.().catch(() => {});
    };
    const closePopover = () => {
        setOpen(false);
    };
    const select = (mode: MessageThreadWorkingMode) => {
        setWorkingMode(mode);
        closePopover();
        nameElement?.blur();
    };

    if (editing?.mode === 'reply') {
        return (
            <Layout>
                To:
                <Name>{stringifyWorkingMode(workingMode)}</Name>
            </Layout>
        );
    }

    return (
        <Layout>
            To:
            <Name ref={setNameElement} tabIndex={0} onFocus={openPopover} onBlur={closePopover}>
                {stringifyWorkingMode(workingMode)}
                <Popover
                    ref={setPopperElement}
                    style={{...styles.popper, display: open ? 'block' : 'none'}}
                    {...attributes.popper}
                >
                    <Item icon={<Avatar.Assistant />} workingMode="normal" onSelect={select} />
                    <Item icon={<SiCircle />} workingMode="ringRing" onSelect={select} />
                </Popover>
            </Name>
        </Layout>
    );
}
