interface Props {
    type: 'addition' | 'deletion';
    count: number;
}

export default function CountLabel({type, count}: Props) {
    if (!count) {
        return null;
    }

    const color = type === 'addition' ? 'var(--color-addition)' : 'var(--color-deletion)';
    return <span style={{color}}>{type === 'addition' ? '+' : '-'}{count}</span>;
}
