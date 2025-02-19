import {MentionsInputStyle} from 'react-mentions';

const style: MentionsInputStyle = {
    suggestions: {
        list: {
            border: '1px solid var(--color-default-border)',
            borderBottom: 'none',
            fontSize: '.8em',
        },
        item: {
            padding: '0 .5em',
            lineHeight: '2',
            borderBottom: '1px solid var(--color-default-border)',
            color: 'var(--color-default-foreground)',

            '&focused': {
                color: 'var(--color-interactive-foreground)',
                backgroundColor: 'var(--color-interactive-background)',
            },
        },
    },
};

export default style;
