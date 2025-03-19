import Ajv from 'ajv';
import type {Schema, ValidateFunction} from 'ajv';
import {renderFixToolCallPrompt} from '@oniichan/prompt';
import type {FixToolCallView} from '@oniichan/prompt';
import {builtinTools} from '@oniichan/shared/tool';
import {WorkflowValidator} from '../base';
import type {WorkflowStepInit} from '../base';
import {assertAssistantTextMessage, createDetachedUserRequestMessage} from '../../inbox';
import {ToolImplement} from './implement';
import type {ToolImplementInit} from './implement';

const ajv = new Ajv();

class ValidatorCache {
    private readonly cache = new Map<Schema, ValidateFunction>();

    getValidator(schema: Schema): ValidateFunction {
        const cached = this.cache.get(schema);

        if (cached) {
            return cached;
        }

        const validator = ajv.compile(schema);
        this.cache.set(schema, validator);

        return validator;
    }
}

const cache = new ValidatorCache();

interface ValidationSuccess {
    type: 'valid';
}

interface MissingValidationError {
    type: 'missing';
    property: string;
}

interface TypeValidationError {
    type: 'type';
    property: string;
    expectedType: string;
}

interface UnknownValidationError {
    type: 'unknown';
    message: string;
}

type ValidationError = MissingValidationError | TypeValidationError | UnknownValidationError;

type ValidationResult = ValidationSuccess | ValidationError;

function formatErrorMessage(error: ValidationError) {
    switch (error.type) {
        case 'missing':
            return `Missing value for required parameter "${error.property}", this may be caused by empty content in <${error.property}> tag or missing <${error.property}> tag.`;
        case 'type':
            return `Parameter "${error.property}" is not of type ${error.expectedType}.`;
        default:
            return `Parameters have unknown error: ${error.message}.`;
    }
}

export class ToolWorkflowValidator extends WorkflowValidator {
    private readonly implement: ToolImplement;

    constructor(init: WorkflowStepInit) {
        super(init);
        const implementInit: ToolImplementInit = {
            roundtrip: this.roundtrip,
            editorHost: init.editorHost,
            logger: init.logger,
            commandExecutor: init.commandExecutor,
            inboxConfig: init.inboxConfig,
        };
        this.implement = new ToolImplement(implementInit);
    }

    async validateWorkflow(): Promise<boolean> {
        const source = this.getWorkflowSourceMessageStrict();
        assertAssistantTextMessage(source);
        const tool = this.getToolDefinition();
        const chunk = source.findToolCallChunkStrict();
        const extracted = this.implement.extractArguments(tool.name, chunk.arguments);
        const validateResult = this.validateArguments(tool.parameters, extracted);

        if (validateResult.type === 'valid') {
            return true;
        }

        const {default: pRetry} = await import('p-retry');
        try {
            const newChunk = await pRetry(() => this.fixInputError(validateResult), {retries: 3});
            source.replaceToolCallChunk(newChunk);
            return true;
        }
        catch {
            this.logger.error('FixInputErrorFail=', {threadUuid: this.thread.uuid, messageUuid: source.uuid});
            return false;
        }
    }

    private validateArguments(schema: Schema, parameters: Record<string, unknown>): ValidationResult {
        const validator = cache.getValidator(schema);
        const valid = validator(parameters);
        const error = validator.errors?.at(0);

        if (valid || !error) {
            return {type: 'valid'};
        }

        if (error.keyword === 'required') {
            return {
                type: 'missing',
                property: error.params.missingProperty,
            };
        }
        else if (error.keyword === 'type') {
            return {
                type: 'type',
                property: error.instancePath.slice(1),
                expectedType: error.params.type,
            };
        }

        return {
            type: 'unknown',
            message: ajv.errorsText(validator.errors),
        };
    }

    private async fixInputError(error: ValidationError) {
        const source = this.getWorkflowSourceMessageStrict();
        assertAssistantTextMessage(source);
        const tool = this.getToolDefinition();
        const view: FixToolCallView = {
            tool,
            errorContent: source.getTextContent(),
            errorMessage: formatErrorMessage(error),
        };
        const prompt = renderFixToolCallPrompt(view);
        const newMessage = await this.requestNewAssistantTextMessage(
            createDetachedUserRequestMessage(prompt),
            {includeBaseMessages: false, includeSystemPrompt: false}
        );
        const newChunk = newMessage.findToolCallChunk();

        if (!newChunk) {
            throw new Error('No tool call found in fix response');
        }

        const validateResult = this.validateArguments(tool.parameters, newChunk.arguments);

        if (validateResult.type !== 'valid') {
            throw new Error('Failed to fix tool call input error');
        }

        return newChunk;
    }

    private getToolDefinition() {
        const source = this.getWorkflowSourceMessageStrict();
        assertAssistantTextMessage(source);
        const input = source.findToolCallChunkStrict();
        const tool = builtinTools.find(v => v.name === input.toolName);

        if (!tool) {
            throw new Error(`This message contains a tool call chunk with unsupported tool name ${input.toolName}`);
        }

        return tool;
    }
}
