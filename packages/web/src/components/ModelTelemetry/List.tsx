import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import type {ModelUsageRecord} from '@oniichan/storage/telemetry';
import {useIpc} from '@/components/AppProvider';

const Card = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    padding: 1.5em;
    background: white;
    border-radius: .5em;
    max-height: 200px;
    width: 100%;
    border: 1px solid #eaeaea;
`;

const Section = styled.div`
    flex: 1;
    min-width: 200px;
`;

const Label = styled.div`
    color: #666;
    margin-bottom: .3em;
    font-weight: 500;
`;

const Value = styled.div`
    color: #333;
    word-break: break-all;
`;

const TokenSection = styled.div`
    display: flex;
    gap: 2em;
    flex: 2;
    min-width: 200px;
`;

const TokenBox = styled.div`
    background: #f5f5f5;
    padding: 1em;
    border-radius: .5em;
    flex: 1;
`;

const ModelBadge = styled.div`
    background: #e8f0fe;
    color: #1a73e8;
    padding: .5em 1em;
    border-radius: 1em;
    display: inline-block;
    font-weight: 500;
`;

interface ItemProps {
    record: ModelUsageRecord;
}

export const Item = ({record}: ItemProps) => {
    return (
        <Card>
            <Section>
                <Label>UUID</Label>
                <Value>{record.uuid}</Value>
            </Section>

            <Section>
                <Label>Model</Label>
                <ModelBadge>{record.modelName || 'unknown'}</ModelBadge>
            </Section>

            <Section>
                <Label>Start Time</Label>
                <Value>{record.startTime}</Value>
            </Section>

            <Section>
                <Label>End Time</Label>
                <Value>{record.endTime}</Value>
            </Section>

            <TokenSection>
                <TokenBox>
                    <Label>Input Tokens</Label>
                    <Value>{record.inputTokens ?? 'N/A'}</Value>
                </TokenBox>
                <TokenBox>
                    <Label>Output Tokens</Label>
                    <Value>{record.outputTokens ?? 'N/A'}</Value>
                </TokenBox>
            </TokenSection>
        </Card>
    );
};

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export default function List() {
    const ipc = useIpc();
    const [dataSource, setDataSource] = useState<ModelUsageRecord[]>([]);
    useEffect(
        () => {
            void (async () => {
                const dataSource = await ipc.kernel.call(crypto.randomUUID(), 'modelTelemetry');
                setDataSource(dataSource);
            })();
        },
        []
    );

    return (
        <Layout>
            {dataSource.map(v => <Item key={v.uuid} record={v} />)}
        </Layout>
    );
}
