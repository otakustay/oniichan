import {ToolCallMessageChunk, ParsedToolCallMessageChunk} from './tool';
import {ToolParsedChunk, ContentTagName, PlanTaskType} from '../tool';

export interface ReasoningMessageChunk {
    type: 'reasoning';
    content: string;
}

export interface TextMessageChunk {
    type: 'text';
    content: string;
}

export interface PlanTask {
    taskType: PlanTaskType;
    text: string;
}

export interface PlanMessageChunk {
    type: 'plan';
    tasks: PlanTask[];
    source: string;
    status: 'generating' | 'completed';
}

export interface TaggedMessageChunk {
    type: 'content';
    tagName: ContentTagName;
    content: string;
    status: 'generating' | 'completed';
}

export type MessageInputChunk = ReasoningMessageChunk | ToolParsedChunk;

export type AssistantTextMessageContentChunk =
    | ReasoningMessageChunk
    | TextMessageChunk
    | PlanMessageChunk
    | ToolCallMessageChunk
    | TaggedMessageChunk;

export type PlanMessageContentChunk = AssistantTextMessageContentChunk;

export type ToolCallMessageContentChunk =
    | ReasoningMessageChunk
    | TextMessageChunk
    | ParsedToolCallMessageChunk
    | TaggedMessageChunk;

export type MessageViewChunk = AssistantTextMessageContentChunk | ToolCallMessageContentChunk;

export interface MessageDataBase {
    uuid: string;
    createdAt: string;
    error?: string | undefined;
}

export interface UserRequestMessageData extends MessageDataBase {
    type: 'userRequest';
    content: string;
}

export interface AssistantResponseMessageData extends MessageDataBase {
    type: 'assistantResponse';
    chunks: MessageViewChunk[];
}

export interface AssistantTextMessageData extends MessageDataBase {
    type: 'assistantText';
    chunks: AssistantTextMessageContentChunk[];
}

export interface PlanMessageData extends MessageDataBase {
    type: 'plan';
    chunks: PlanMessageContentChunk[];
}

export interface ToolCallMessageData extends MessageDataBase {
    type: 'toolCall';
    chunks: ToolCallMessageContentChunk[];
}

export interface ToolUseMessageData extends MessageDataBase {
    type: 'toolUse';
    content: string;
}

export type AssistantMessageData = AssistantTextMessageData | PlanMessageData | ToolCallMessageData;

export type MessageData = UserRequestMessageData | AssistantMessageData | ToolUseMessageData;

export type MessageViewData = UserRequestMessageData | AssistantResponseMessageData;

export type MessageType = MessageData['type'];

export type AssistantMessageType = 'assistantText' | 'plan' | 'toolCall';

export type MessageViewType = MessageViewData['type'];
