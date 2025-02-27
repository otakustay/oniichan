import path from 'node:path';
import dedent from 'dedent';
import {projectConfig, projectRules} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/error';
import {RequestHandler} from '../handler';

const GIT_IGNORE = dedent`
    tmp
`;

// TODO: Add guideline to configure command allow and deny list in rules after it's implemented
const DEFAULT_RULES = dedent`
    <!-- Rules Guideline Start -->
    Please read this guideline before you start writing your rules, this file **will not take effect** until you delete all text from \`<!-- Rules Guideline Start -->\` to \`<!-- Rules Guideline End -->\`.

    Rules allows you to inject custom prompt communicating with LLM, this is actually done by replacing a **Rule** section in Oniichan's system prompt.

    Rules files are markdown files with an special extension \`.omd\` (Oniichan Markdown), there is no additional syntax other than markdown.

    The default rule file is always \`.oniichan/rules/default.omd\` in your workspace, this path is case sensitive so files like \`DEFAULT.omd\` or \`Default.omd\` will not work.

    To write a rule file, we recommend you to obey these resitrictions:

    1. Start with \`<h2>\` tag, which is \`## Something\` in markdown, **do not use \`<h1>\` tag**.
    2. Explain your project structure, reusable components, etc... in this file.
    3. Use \`#path/to/file\` to reference files in your project, note there is **no whitespace after \`#\`**.
    <!-- Rules Guideline End -->
`;

export class InitializeProjectConfigHandler extends RequestHandler<void, void> {
    static readonly action = 'initializeProjectConfig';

    // eslint-disable-next-line require-yield
    async *handleRequest(): AsyncIterable<void> {
        const {editorHost, logger} = this.context;
        logger.info('Start');

        const root = await editorHost.call('getWorkspaceRoot');

        if (!root) {
            logger.error('NoWorkspaceRoot');
            return;
        }

        const configDirectory = projectConfig();

        try {
            const gitIgnoreFile = path.join(configDirectory, '.gitignore');
            const existsGitIgnore = await editorHost.call('checkFileExists', gitIgnoreFile);
            if (!existsGitIgnore) {
                logger.trace('WriteGitIgnore');
                await editorHost.call('writeWorkspaceFile', {file: gitIgnoreFile, content: GIT_IGNORE});
            }

            const defaultRuleFile = projectRules('default');
            const existsDefaultRule = await editorHost.call('checkFileExists', defaultRuleFile);
            if (!existsDefaultRule) {
                logger.trace('WriteDefaultRule');
                await editorHost.call('writeWorkspaceFile', {file: defaultRuleFile, content: DEFAULT_RULES});
            }

            logger.trace('OpenDefaultRule');
            await editorHost.call('openDocument', defaultRuleFile);

            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}
