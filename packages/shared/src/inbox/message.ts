import type {ToolParsedChunk, ContentTagName} from '../tool';
import type {ToolCallMessageChunk, ParsedToolCallMessageChunk} from './tool';

export type AssistantRole = 'standalone' | 'planner' | 'actor' | 'coder';

export interface ReasoningMessageChunk {
    type: 'reasoning';
    content: string;
}

export interface TextMessageChunk {
    type: 'text';
    content: string;
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
    | ToolCallMessageChunk
    | TaggedMessageChunk;

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
    role: AssistantRole;
    chunks: AssistantTextMessageContentChunk[];
}

export interface ToolCallMessageData extends MessageDataBase {
    type: 'toolCall';
    role: AssistantRole;
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
