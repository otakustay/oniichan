import {Diagnostic, DiagnosticSeverity, languages, Uri, window} from 'vscode';
import {RequestHandler} from './handler';

export class GetDocumentTextHandler extends RequestHandler<string, string> {
    static readonly action = 'getDocumentText';

    async *handleRequest(uri: string): AsyncIterable<string> {
        const {logger} = this.context;
        logger.info('Start', {uri});

        const editor = window.visibleTextEditors.find(v => v.document.uri.toString() === uri);

        if (!editor) {
            logger.error('DocumentNotVisible');
            throw new Error(`Document ${uri} is not visible in editor`);
        }

        yield editor.document.getText();
        logger.info('Finish');
    }
}

export class GetDocumentLanguageIdHandler extends RequestHandler<string, string> {
    static readonly action = 'getDocumentLanguageId';

    async *handleRequest(uri: string): AsyncIterable<string> {
        const {logger} = this.context;
        logger.info('Start', {uri});

        const editor = window.visibleTextEditors.find(v => v.document.uri.toString() === uri);

        if (!editor) {
            logger.error('DocumentNotVisible');
            throw new Error(`Document ${uri} is not visible in editor`);
        }

        yield editor.document.languageId;
        logger.info('Finish');
    }
}

export interface DocumentLine {
    uri: string;
    line: number;
}

export interface LineDiagnostic {
    severity: 'error' | 'warning' | 'information' | 'hint';
    message: string;
}

function stringifyDiagnosticSeverity(severity: DiagnosticSeverity): LineDiagnostic['severity'] {
    switch (severity) {
        case DiagnosticSeverity.Error:
            return 'error';
        case DiagnosticSeverity.Warning:
            return 'warning';
        case DiagnosticSeverity.Information:
            return 'information';
        default:
            return 'hint';
    }
}

function toLineDiagnostic(diagnostic: Diagnostic): LineDiagnostic {
    return {
        severity: stringifyDiagnosticSeverity(diagnostic.severity),
        message: diagnostic.message,
    };
}

export class GetDocumentDiagnosticAtLineHandler extends RequestHandler<DocumentLine, LineDiagnostic[]> {
    static readonly action = 'getDocumentDiagnosticAtLine';

    async *handleRequest(payload: DocumentLine): AsyncIterable<LineDiagnostic[]> {
        const {logger} = this.context;
        logger.info('Start', payload);

        const editor = window.visibleTextEditors.find(v => v.document.uri.toString() === payload.uri);

        if (!editor) {
            logger.error('DocumentNotVisible');
            throw new Error(`Document ${payload.uri} is not visible in editor`);
        }

        const atLine = ({range}: Diagnostic) => range.isSingleLine && range.start.line === payload.line;
        const diagnostics = languages.getDiagnostics(Uri.parse(payload.uri)).filter(atLine);
        yield diagnostics.map(toLineDiagnostic);

        logger.info('Finish');
    }
}
