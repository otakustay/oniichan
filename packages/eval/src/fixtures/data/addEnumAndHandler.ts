import type {FixtureConfig} from '../interface.js';

const fixture: FixtureConfig = {
    name: 'add-enum-and-handler',
    source: {
        type: 'zip',
        path: 'add-enum-and-handler.zip',
    },
    query: {
        text:
            'handleMessage中增加一个枚举的case：restartDocument，先关闭文件，再打开文件, 环境问题该项目无法运行，只需改动相应的文件即可，无需运行。',
    },
    tests: [
        {
            name: 'file-content',
            minScore: 2,
            type: 'file',
            files: [
                {
                    path: 'src/main/java/com/baidu/comate/intellij/toolwindow/webview/enums/ActionEnum.java',
                    includes: ['restartDocument'],
                    score: 1,
                },
                {
                    path: 'src/main/java/com/baidu/comate/intellij/agent/handler/DocumentHandler.java',
                    includes: ['case restartDocument:'],
                    score: 1,
                },
            ],
        },
    ],
};

export default fixture;
