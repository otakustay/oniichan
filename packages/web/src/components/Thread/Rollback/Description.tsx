import styled from '@emotion/styled';
import {countNounSimple} from '@oniichan/shared/string';
import {IoAlertCircleOutline, IoGitMergeOutline} from 'react-icons/io5';

const ConflictSign = styled(IoGitMergeOutline)`
    color: var(--color-error);
    position: relative;
    top: .12em;
    font-size: .8em;
`;

const ErrorSign = styled(IoAlertCircleOutline)`
    color: var(--color-error);
    position: relative;
    top: .12em;
    font-size: .8em;
`;

const List = styled.ul`
    padding-left: 2em;
`;

interface Props {
    affectedCount: number;
}

export function Description({affectedCount}: Props) {
    return (
        <>
            <p>
                You are going to rollback{' '}
                {countNounSimple(affectedCount, 'file')}, please carefully check the status of all files in the table.
            </p>
            <List>
                <li>
                    <ConflictSign /> means rollback conflicts with your current code.
                </li>
                <li>
                    <ErrorSign /> means rollback contains error.
                </li>
                <li>
                    Unrecoverable errors have a disabled checkbox.
                </li>
            </List>
        </>
    );
}
