import {ToolName, ToolParsedChunk} from '../tool';

export interface ReasoningMessageChunk {
    type: 'reasoning';
    content: string;
}

export interface TextMessageChunk {
    type: 'text';
    content: string;
}

/** Text that should be render directly without formatting to markdown */
export interface PlainTextMessageChunk {
    type: 'plainText';
    content: string;
}

export interface ToolCallMessageChunk {
    type: 'toolCall';
    toolName: ToolName;
    arguments: Record<string, string | undefined>;
    status: 'generating' | 'executing' | 'completed';
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

export type DebugContentChunk = TextMessageChunk | PlainTextMessageChunk;

export type MessageViewChunk = MessageContentChunk | DebugContentChunk;

export interface MessageDataBase {
    uuid: string;
    createdAt: string;
    error?: string | undefined;
}

export type DebugMessageLevel = 'error' | 'warning' | 'info';

export interface DebugMessageData extends MessageDataBase {
    type: 'debug';
    level: DebugMessageLevel;
    title: string;
    content: DebugContentChunk;
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

export type MessageData =
    | DebugMessageData
    | UserRequestMessageData
    | AssistantTextMessageData
    | ToolCallMessageData
    | ToolUseMessageData;

export type MessageType = MessageData['type'];

export type FileEditAction = 'create' | 'delete' | 'edit';

export interface FileEditResult {
    type: FileEditAction;
    file: string;
    oldContent: string;
    newContent: string;
    deletedCount: number;
    insertedCount: number;
}

export interface FileEditError {
    type: 'error';
    message: string;
}

export type FileEditData = FileEditResult | FileEditError;
