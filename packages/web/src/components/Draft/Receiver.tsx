import {useState} from 'react';
import styled from '@emotion/styled';
import {usePopper} from 'react-popper';
import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {useSetWorkingMode, useWorkingModeSubmitValue} from '@oniichan/web-host/atoms/inbox';
import {useEditingValue} from '@oniichan/web-host/atoms/draft';
import {stringifyWorkingMode} from './utils';
import ModeSelect from './ModeSelect';

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

const Popover = styled.div`
    background-color: var(--color-default-background);
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

export function Receiver() {
    const editing = useEditingValue();
    const workingMode = useWorkingModeSubmitValue();
    const setWorkingMode = useSetWorkingMode();
    const [open, setOpen] = useState(false);
    const [nameElement, setNameElement] = useState<HTMLSpanElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
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
                    <ModeSelect onSelect={select} />
                </Popover>
            </Name>
        </Layout>
    );
}
