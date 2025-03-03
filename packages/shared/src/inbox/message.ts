import {ToolCallMessageChunk, ParsedToolCallMessageChunk} from './tool';
import {ToolParsedChunk} from '../tool';

export interface ReasoningMessageChunk {
    type: 'reasoning';
    content: string;
}

export interface TextMessageChunk {
    type: 'text';
    content: string;
}

export interface ThinkingMessageChunk {
    type: 'thinking';
    content: string;
    status: 'generating' | 'completed';
}

export type MessageInputChunk = ReasoningMessageChunk | ToolParsedChunk;

export type AssistantTextMessageContentChunk =
    | ReasoningMessageChunk
    | TextMessageChunk
    | ToolCallMessageChunk
    | ThinkingMessageChunk;

export type ToolCallMessageContentChunk =
    | ReasoningMessageChunk
    | TextMessageChunk
    | ParsedToolCallMessageChunk
    | ThinkingMessageChunk;

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

export interface ToolCallMessageData extends MessageDataBase {
    type: 'toolCall';
    chunks: ToolCallMessageContentChunk[];
}

export interface ToolUseMessageData extends MessageDataBase {
    type: 'toolUse';
    content: string;
}

export type AssistantMessageData = AssistantTextMessageData | ToolCallMessageData;

export type MessageData = UserRequestMessageData | AssistantMessageData | ToolUseMessageData;

export type MessageViewData = UserRequestMessageData | AssistantResponseMessageData;

export type MessageType = MessageData['type'];

export type MessageViewType = MessageViewData['type'];
