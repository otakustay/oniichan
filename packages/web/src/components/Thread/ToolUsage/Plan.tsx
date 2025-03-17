import styled from '@emotion/styled';
import {IoCheckboxOutline, IoEllipsisVerticalOutline, IoSquareOutline} from 'react-icons/io5';
import type {PlanTask, PlanTaskStatus} from '@oniichan/shared/tool';
import ActBar from '@/components/ActBar';
import LoadingIcon from '@/components/LoadingIcon';

const NameLabel = styled.span`
    color: var(--color-secondary-foreground);
`;

const DescriptionLabel = styled.span`
    background-color: var(--color-contrast-background);
    font-size: .8em;
    padding: .25em .5em;
    border-radius: .25em;
`;

const Icon = styled.i`
    position: relative;
    top: .12em;
    margin-right: .5em;
    color: var(--color-secondary-foreground);
`;

interface TaskIconProps {
    status: PlanTaskStatus;
}

function TaskIcon({status}: TaskIconProps) {
    const icon = status === 'executing'
        ? <LoadingIcon />
        : (status === 'completed' ? <IoCheckboxOutline /> : <IoSquareOutline />);

    return (
        <Icon>
            {icon}
        </Icon>
    );
}

const TaskList = styled.ol`
    padding: 0;
    line-height: 1.5;
    margin: 1em 0 0;
    font-size: .8em;
    list-style: none;
`;

interface TaskProps {
    task: PlanTask;
}

function Task({task}: TaskProps) {
    return (
        <li>
            <TaskIcon status={task.status} />
            {task.text}
        </li>
    );
}

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
                {tasks.map((v, i) => <Task key={`task-${v.taskType}-${i}`} task={v} />)}
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
