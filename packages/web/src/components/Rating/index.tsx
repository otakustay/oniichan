import styled from '@emotion/styled';

interface ItemProps {
    fill: boolean;
}

const Item = styled.i<ItemProps>`
    width: 2em;
    height: .5em;
    border-radius: 1em;
    background-color: ${props => `var(--color-${props.fill ? 'success' : 'secondary-foreground'})`};
`;

const Layout = styled.div`
    display: flex;
    gap: .2em;
`;

interface Props {
    max: number;
    value: number;
}

export default function Rating({max, value}: Props) {
    const values = Array.from({length: max}).map((v, i) => i < value);

    return (
        <Layout>
            {values.map((v, i) => <Item key={i} fill={v} />)}
        </Layout>
    );
}
