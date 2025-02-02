import Ajv, {Schema, ValidateFunction} from 'ajv';
import {EditorHost} from '../../editor';

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

type ValidationResult = ValidationSuccess | MissingValidationError | TypeValidationError | UnknownValidationError;

function validateArguments(schema: Schema, args: Record<string, unknown>): ValidationResult {
    const validator = cache.getValidator(schema);
    const valid = validator(args);
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

export interface ParameterMissingError {
    type: 'parameterMissing';
    parameter: string;
}

export interface ParameterTypeError {
    type: 'parameterType';
    parameter: string;
    expectedType: string;
}

export interface ValidationError {
    type: 'validationError';
    message: string;
}

export interface ExecuteError {
    type: 'executeError';
    output: string;
}

export interface Success {
    type: 'success';
    finished: boolean;
    output: string;
}

export type ToolInputError = ParameterMissingError | ParameterTypeError | ValidationError;

export type ToolRunResult = Success | ExecuteError | ToolInputError;

export abstract class ToolImplementBase<A extends Partial<Record<keyof A, any>> = Record<string, any>> {
    protected readonly editorHost: EditorHost;

    private readonly schema: Schema;

    constructor(editorHost: EditorHost, schema: Schema) {
        this.editorHost = editorHost;
        this.schema = schema;
    }

    async run(generated: Record<string, string>): Promise<ToolRunResult> {
        const parsed = this.parseArgs(generated);
        const validateResult = validateArguments(this.schema, parsed);

        if (validateResult.type === 'valid') {
            return this.execute(parsed);
        }

        switch (validateResult.type) {
            case 'missing':
                return {type: 'parameterMissing', parameter: validateResult.property};
            case 'type':
                return {
                    type: 'parameterType',
                    parameter: validateResult.property,
                    expectedType: validateResult.expectedType,
                };
            default:
                return {type: 'validationError', message: validateResult.message};
        }
    }

    protected abstract parseArgs(args: Record<string, string>): A;

    protected abstract execute(args: A): Promise<ToolRunResult>;
}

export function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

export function resultMarkdown(title: string, content: string, langauge = '') {
    return `${title}\n\n${codeBlock(content, langauge)}`;
}
