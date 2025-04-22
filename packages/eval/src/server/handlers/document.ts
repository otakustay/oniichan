import path from 'node:path';
import type {DocumentLine, LineDiagnostic} from '@oniichan/editor-host/protocol';
import {RequestHandler} from './handler';

export class GetDocumentTextHandler extends RequestHandler<string, string> {
    static readonly action = 'getDocumentText';

    async *handleRequest(uri: string): AsyncIterable<string> {
        const content = await this.readFileContent(uri);
        yield content;
    }
}

export const languageData = [
    {
        id: 'bat',
        extensions: [
            '.bat',
            '.cmd',
        ],
    },
    {
        id: 'clojure',
        extensions: [
            '.clj',
            '.cljs',
            '.cljc',
            '.cljx',
            '.clojure',
            '.edn',
        ],
    },
    {
        id: 'coffeescript',
        extensions: [
            '.coffee',
            '.cson',
            '.iced',
        ],
    },
    {
        id: 'jsonc',
        extensions: [
            '.code-workspace',
            'language-configuration.json',
            'icon-theme.json',
            'color-theme.json',
        ],
        names: [
            'settings.json',
            'launch.json',
            'tasks.json',
            'keybindings.json',
            'extensions.json',
            'argv.json',
            'profiles.json',
            'devcontainer.json',
            '.devcontainer.json',
        ],
    },
    {
        id: 'json',
        extensions: [
            '.code-profile',
        ],
    },
    {
        id: 'c',
        extensions: [
            '.c',
            '.i',
        ],
    },
    {
        id: 'cpp',
        extensions: [
            '.cpp',
            '.cc',
            '.cxx',
            '.c++',
            '.hpp',
            '.hh',
            '.hxx',
            '.h++',
            '.h',
            '.ii',
            '.ino',
            '.inl',
            '.ipp',
            '.ixx',
            '.tpp',
            '.txx',
            '.hpp.in',
            '.h.in',
        ],
    },
    {
        id: 'cuda-cpp',
        extensions: [
            '.cu',
            '.cuh',
        ],
    },
    {
        id: 'csharp',
        extensions: [
            '.cs',
            '.csx',
            '.cake',
        ],
    },
    {
        id: 'css',
        extensions: [
            '.css',
        ],
        mimeTypes: [
            'text/css',
        ],
    },
    {
        id: 'dart',
        extensions: [
            '.dart',
        ],
    },
    {
        id: 'diff',
        extensions: [
            '.diff',
            '.patch',
            '.rej',
        ],
    },
    {
        id: 'dockerfile',
        extensions: [
            '.dockerfile',
            '.containerfile',
        ],
        patterns: [
            'Dockerfile.*',
            'Containerfile.*',
        ],
        names: [
            'Dockerfile',
            'Containerfile',
        ],
    },
    {
        id: 'ignore',
        names: [
            '.vscodeignore',
        ],
    },
    {
        id: 'fsharp',
        extensions: [
            '.fs',
            '.fsi',
            '.fsx',
            '.fsscript',
        ],
    },
    {
        id: 'git-commit',
        names: [
            'COMMIT_EDITMSG',
            'MERGE_MSG',
        ],
    },
    {
        id: 'git-rebase',
        patterns: [
            '**/rebase-merge/done',
        ],
        names: [
            'git-rebase-todo',
        ],
    },
    {
        id: 'ignore',
        extensions: [
            '.gitignore_global',
            '.gitignore',
            '.git-blame-ignore-revs',
        ],
    },
    {
        id: 'go',
        extensions: [
            '.go',
        ],
    },
    {
        id: 'groovy',
        extensions: [
            '.groovy',
            '.gvy',
            '.gradle',
            '.jenkinsfile',
            '.nf',
        ],
        firstLine: '^#!.*\\bgroovy\\b',
        patterns: [
            'Jenkinsfile*',
        ],
        names: [
            'Jenkinsfile',
        ],
    },
    {
        id: 'handlebars',
        extensions: [
            '.handlebars',
            '.hbs',
            '.hjs',
        ],
        mimeTypes: [
            'text/x-handlebars-template',
        ],
    },
    {
        id: 'hlsl',
        extensions: [
            '.hlsl',
            '.hlsli',
            '.fx',
            '.fxh',
            '.vsh',
            '.psh',
            '.cginc',
            '.compute',
        ],
    },
    {
        id: 'html',
        extensions: [
            '.html',
            '.htm',
            '.shtml',
            '.xhtml',
            '.xht',
            '.mdoc',
            '.jsp',
            '.asp',
            '.aspx',
            '.jshtm',
            '.volt',
            '.ejs',
            '.rhtml',
        ],
        mimeTypes: [
            'text/html',
            'text/x-jshtm',
            'text/template',
            'text/ng-template',
            'application/xhtml+xml',
        ],
    },
    {
        id: 'ini',
        extensions: [
            '.ini',
        ],
    },
    {
        id: 'properties',
        extensions: [
            '.conf',
            '.properties',
            '.cfg',
            '.directory',
            '.gitattributes',
            '.gitconfig',
            '.gitmodules',
            '.editorconfig',
            '.repo',
        ],
        patterns: [
            '**/.config/git/config',
            '**/.git/config',
        ],
        names: [
            'gitconfig',
            '.env',
        ],
    },
    {
        id: 'java',
        extensions: [
            '.java',
            '.jav',
        ],
    },
    {
        id: 'javascriptreact',
        extensions: [
            '.jsx',
        ],
    },
    {
        id: 'javascript',
        extensions: [
            '.js',
            '.es6',
            '.mjs',
            '.cjs',
            '.pac',
        ],
        firstLine: '^#!.*\\bnode',
        names: [
            'jakefile',
        ],
        mimeTypes: [
            'text/javascript',
        ],
    },
    {
        id: 'jsx-tags',
    },
    {
        id: 'json',
        extensions: [
            '.json',
            '.bowerrc',
            '.jscsrc',
            '.webmanifest',
            '.js.map',
            '.css.map',
            '.ts.map',
            '.har',
            '.jslintrc',
            '.jsonld',
            '.geojson',
            '.ipynb',
            '.vuerc',
        ],
        names: [
            'composer.lock',
            '.watchmanconfig',
        ],
        mimeTypes: [
            'application/json',
            'application/manifest+json',
        ],
    },
    {
        id: 'jsonc',
        extensions: [
            '.jsonc',
            '.eslintrc',
            '.eslintrc.json',
            '.jsfmtrc',
            '.jshintrc',
            '.swcrc',
            '.hintrc',
            '.babelrc',
        ],
        names: [
            'babel.config.json',
            '.babelrc.json',
            '.ember-cli',
            'typedoc.json',
        ],
    },
    {
        id: 'jsonl',
        extensions: [
            '.jsonl',
        ],
        names: [],
    },
    {
        id: 'snippets',
        extensions: [
            '.code-snippets',
        ],
        patterns: [
            '**/User/snippets/*.json',
            '**/User/profiles/*/snippets/*.json',
        ],
    },
    {
        id: 'julia',
        extensions: [
            '.jl',
        ],
        firstLine: '^#!\\s*/.*\\bjulia[0-9.-]*\\b',
    },
    {
        id: 'juliamarkdown',
        extensions: [
            '.jmd',
        ],
    },
    {
        id: 'tex',
        extensions: [
            '.sty',
            '.cls',
            '.bbx',
            '.cbx',
        ],
    },
    {
        id: 'latex',
        extensions: [
            '.tex',
            '.ltx',
            '.ctx',
        ],
    },
    {
        id: 'bibtex',
        extensions: [
            '.bib',
        ],
    },
    {
        id: 'cpp_embedded_latex',
    },
    {
        id: 'markdown_latex_combined',
    },
    {
        id: 'less',
        extensions: [
            '.less',
        ],
        mimeTypes: [
            'text/x-less',
            'text/less',
        ],
    },
    {
        id: 'log',
        extensions: [
            '.log',
            '*.log.?',
        ],
    },
    {
        id: 'lua',
        extensions: [
            '.lua',
        ],
    },
    {
        id: 'makefile',
        extensions: [
            '.mak',
            '.mk',
        ],
        firstLine: '^#!\\s*/usr/bin/make',
        names: [
            'Makefile',
            'makefile',
            'GNUmakefile',
            'OCamlMakefile',
        ],
    },
    {
        id: 'markdown',
        extensions: [
            '.md',
            '.mkd',
            '.mdwn',
            '.mdown',
            '.markdown',
            '.markdn',
            '.mdtxt',
            '.mdtext',
            '.workbook',
        ],
    },
    {
        id: 'markdown-math',
    },
    {
        id: 'ignore',
        extensions: [
            '.npmignore',
        ],
    },
    {
        id: 'properties',
        extensions: [
            '.npmrc',
        ],
    },
    {
        id: 'objective-c',
        extensions: [
            '.m',
        ],
    },
    {
        id: 'objective-cpp',
        extensions: [
            '.mm',
        ],
    },
    {
        id: 'perl',
        extensions: [
            '.pl',
            '.pm',
            '.pod',
            '.t',
            '.PL',
            '.psgi',
        ],
        firstLine: '^#!.*\\bperl\\b',
    },
    {
        id: 'raku',
        extensions: [
            '.raku',
            '.rakumod',
            '.rakutest',
            '.rakudoc',
            '.nqp',
            '.p6',
            '.pl6',
            '.pm6',
        ],
        firstLine: '(^#!.*\\bperl6\\b)|use\\s+v6|raku|=begin\\spod|my\\sclass',
    },
    {
        id: 'php',
        extensions: [
            '.php',
            '.php4',
            '.php5',
            '.phtml',
            '.ctp',
        ],
        firstLine: '^#!\\s*/.*\\bphp\\b',
        mimeTypes: [
            'application/x-php',
        ],
    },
    {
        id: 'powershell',
        extensions: [
            '.ps1',
            '.psm1',
            '.psd1',
            '.pssc',
            '.psrc',
        ],
        firstLine: '^#!\\s*/.*\\bpwsh\\b',
    },
    {
        id: 'jade',
        extensions: [
            '.pug',
            '.jade',
        ],
    },
    {
        id: 'python',
        extensions: [
            '.py',
            '.rpy',
            '.pyw',
            '.cpy',
            '.gyp',
            '.gypi',
            '.pyi',
            '.ipy',
            '.pyt',
        ],
        firstLine: '^#!\\s*/?.*\\bpython[0-9.-]*\\b',
        names: [
            'SConstruct',
            'SConscript',
        ],
    },
    {
        id: 'r',
        extensions: [
            '.r',
            '.rhistory',
            '.rprofile',
            '.rt',
        ],
    },
    {
        id: 'razor',
        extensions: [
            '.cshtml',
            '.razor',
        ],
        mimeTypes: [
            'text/x-cshtml',
        ],
    },
    {
        id: 'restructuredtext',
        extensions: [
            '.rst',
        ],
    },
    {
        id: 'ruby',
        extensions: [
            '.rb',
            '.rbx',
            '.rjs',
            '.gemspec',
            '.rake',
            '.ru',
            '.erb',
            '.podspec',
            '.rbi',
        ],
        firstLine: '^#!\\s*/.*\\bruby\\b',
        names: [
            'rakefile',
            'gemfile',
            'guardfile',
            'podfile',
            'capfile',
            'cheffile',
            'hobofile',
            'vagrantfile',
            'appraisals',
            'rantfile',
            'berksfile',
            'berksfile.lock',
            'thorfile',
            'puppetfile',
            'dangerfile',
            'brewfile',
            'fastfile',
            'appfile',
            'deliverfile',
            'matchfile',
            'scanfile',
            'snapfile',
            'gymfile',
        ],
    },
    {
        id: 'rust',
        extensions: [
            '.rs',
        ],
    },
    {
        id: 'scss',
        extensions: [
            '.scss',
        ],
        mimeTypes: [
            'text/x-scss',
            'text/scss',
        ],
    },
    {
        id: 'search-result',
        extensions: [
            '.code-search',
        ],
    },
    {
        id: 'shaderlab',
        extensions: [
            '.shader',
        ],
    },
    {
        id: 'shellscript',
        extensions: [
            '.sh',
            '.bash',
            '.bashrc',
            '.bash_aliases',
            '.bash_profile',
            '.bash_login',
            '.ebuild',
            '.profile',
            '.bash_logout',
            '.xprofile',
            '.xsession',
            '.xsessionrc',
            '.Xsession',
            '.zsh',
            '.zshrc',
            '.zprofile',
            '.zlogin',
            '.zlogout',
            '.zshenv',
            '.zsh-theme',
            '.fish',
            '.ksh',
            '.csh',
            '.cshrc',
            '.tcshrc',
            '.yashrc',
            '.yash_profile',
        ],
        firstLine:
            '^#!.*\\b(bash|fish|zsh|sh|ksh|dtksh|pdksh|mksh|ash|dash|yash|sh|csh|jcsh|tcsh|itcsh).*|^#\\s*-\\*-[^*]*mode:\\s*shell-script[^*]*-\\*-',
        patterns: [
            '.env.*',
        ],
        names: [
            'APKBUILD',
            'PKGBUILD',
            '.envrc',
            '.hushlogin',
            'zshrc',
            'zshenv',
            'zlogin',
            'zprofile',
            'zlogout',
            'bashrc_Apple_Terminal',
            'zshrc_Apple_Terminal',
        ],
        mimeTypes: [
            'text/x-shellscript',
        ],
    },
    {
        id: 'sql',
        extensions: [
            '.sql',
            '.dsql',
        ],
    },
    {
        id: 'swift',
        extensions: [
            '.swift',
        ],
    },
    {
        id: 'typescript',
        extensions: [
            '.ts',
            '.cts',
            '.mts',
        ],
    },
    {
        id: 'typescriptreact',
        extensions: [
            '.tsx',
        ],
    },
    {
        id: 'jsonc',
        patterns: [
            'tsconfig.*.json',
            'jsconfig.*.json',
            'tsconfig-*.json',
            'jsconfig-*.json',
        ],
        names: [
            'tsconfig.json',
            'jsconfig.json',
        ],
    },
    {
        id: 'json',
        extensions: [
            '.tsbuildinfo',
        ],
    },
    {
        id: 'vb',
        extensions: [
            '.vb',
            '.brs',
            '.vbs',
            '.bas',
            '.vba',
        ],
    },
    {
        id: 'xml',
        extensions: [
            '.xml',
            '.xsd',
            '.ascx',
            '.atom',
            '.axml',
            '.axaml',
            '.bpmn',
            '.cpt',
            '.csl',
            '.csproj',
            '.csproj.user',
            '.dita',
            '.ditamap',
            '.dtd',
            '.ent',
            '.mod',
            '.dtml',
            '.fsproj',
            '.fxml',
            '.iml',
            '.isml',
            '.jmx',
            '.launch',
            '.menu',
            '.mxml',
            '.nuspec',
            '.opml',
            '.owl',
            '.proj',
            '.props',
            '.pt',
            '.publishsettings',
            '.pubxml',
            '.pubxml.user',
            '.rbxlx',
            '.rbxmx',
            '.rdf',
            '.rng',
            '.rss',
            '.shproj',
            '.storyboard',
            '.svg',
            '.targets',
            '.tld',
            '.tmx',
            '.vbproj',
            '.vbproj.user',
            '.vcxproj',
            '.vcxproj.filters',
            '.wsdl',
            '.wxi',
            '.wxl',
            '.wxs',
            '.xaml',
            '.xbl',
            '.xib',
            '.xlf',
            '.xliff',
            '.xpdl',
            '.xul',
            '.xoml',
        ],
        firstLine: '(\\<\\?xml.*)|(\\<svg)|(\\<\\!doctype\\s+svg)',
    },
    {
        id: 'xsl',
        extensions: [
            '.xsl',
            '.xslt',
        ],
    },
    {
        id: 'dockercompose',
        patterns: [
            'compose.yml',
            'compose.yaml',
            'compose.*.yml',
            'compose.*.yaml',
            '*docker*compose*.yml',
            '*docker*compose*.yaml',
        ],
    },
    {
        id: 'yaml',
        extensions: [
            '.yml',
            '.eyaml',
            '.eyml',
            '.yaml',
            '.cff',
            '.yaml-tmlanguage',
            '.yaml-tmpreferences',
            '.yaml-tmtheme',
        ],
        firstLine: '^#cloud-config',
    },
];

export class GetDocumentLanguageIdHandler extends RequestHandler<string, string> {
    static readonly action = 'getDocumentLanguageId';

    async *handleRequest(uri: string): AsyncIterable<string> {
        const extension = path.extname(uri);
        const data = languageData.find(data => data.extensions?.includes(extension));
        yield data?.id ?? 'text';
    }
}

export class GetDocumentDiagnosticAtLineHandler extends RequestHandler<DocumentLine, LineDiagnostic[]> {
    static readonly action = 'getDocumentDiagnosticAtLine';

    async *handleRequest(): AsyncIterable<LineDiagnostic[]> {
        yield [];
    }
}

export class OpenDocumentHandler extends RequestHandler<string, void> {
    static readonly action = 'openDocument';

    async *handleRequest(): AsyncIterable<void> {
    }
}
