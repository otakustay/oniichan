import styled from '@emotion/styled';
import {IoEllipsisVerticalOutline} from 'react-icons/io5';
import {PlanTask} from '@oniichan/shared/inbox';
import ActBar from '../ActBar';

const NameLabel = styled.span`
    color: var(--color-secondary-foreground);
`;

const DescriptionLabel = styled.span`
    background-color: var(--color-contrast-background);
    font-size: .8em;
    padding: .25em .5em;
    border-radius: .25em;
`;

const TaskList = styled.ol`
    padding-inline-start: 2em;
    line-height: 1.5;
    margin: 1em 0 0;
    font-size: .8em;
`;

interface Props {
    tasks: PlanTask[];
    closed: boolean;
}

export function Plan({tasks, closed}: Props) {
    const renderTaskList = () => {
        if (!tasks.length) {
            return null;
        }

        return (
            <TaskList>
                {tasks.map((v, i) => <li key={`task-${v.taskType}-${i}`}>{v.text}</li>)}
            </TaskList>
        );
    };

    return (
        <ActBar
            icon={<IoEllipsisVerticalOutline />}
            content={
                <>
                    <NameLabel>{closed ? 'Plan created' : 'Creating a plan...'}</NameLabel>
                    {!!tasks.length && <DescriptionLabel>{tasks.length} tasks</DescriptionLabel>}
                </>
            }
            richContent={renderTaskList()}
        />
    );
}
