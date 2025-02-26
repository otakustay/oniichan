import {FileEditData} from '../patch';
import {ToolName, ToolParsedChunk} from '../tool';

export interface ReasoningMessageChunk {
    type: 'reasoning';
    content: string;
}

export interface TextMessageChunk {
    type: 'text';
    content: string;
}

export type ToolCallChunkStatus =
    | 'generating'
    | 'waitingValidate'
    | 'validateError'
    | 'validated'
    | 'waitingApprove'
    | 'userApproved'
    | 'userRejected'
    | 'executing'
    | 'completed'
    | 'failed';

export interface ToolCallMessageChunk {
    type: 'toolCall';
    toolName: ToolName;
    arguments: Record<string, string | undefined>;
    status: ToolCallChunkStatus;
    fileEdit: FileEditData | null;
    source: string;
}

export interface ThinkingMessageChunk {
    type: 'thinking';
    content: string;
    status: 'generating' | 'completed';
}

export type MessageInputChunk = ReasoningMessageChunk | ToolParsedChunk;

export type MessageContentChunk =
    | ReasoningMessageChunk
    | TextMessageChunk
    | ToolCallMessageChunk
    | ThinkingMessageChunk;

export type MessageViewChunk = MessageContentChunk;

export interface MessageDataBase {
    uuid: string;
    createdAt: string;
    error?: string | undefined;
}

export interface UserRequestMessageData extends MessageDataBase {
    type: 'userRequest';
    content: string;
}

export interface AssistantTextMessageData extends MessageDataBase {
    type: 'assistantText';
    chunks: MessageContentChunk[];
}

export interface ToolCallMessageData extends MessageDataBase {
    type: 'toolCall';
    chunks: MessageContentChunk[];
}

export interface ToolUseMessageData extends MessageDataBase {
    type: 'toolUse';
    content: string;
}

export type MessageData = UserRequestMessageData | AssistantTextMessageData | ToolCallMessageData | ToolUseMessageData;

export type MessageType = MessageData['type'];
