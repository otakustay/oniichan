import type {FixtureConfig} from '../interface.js';

const fixture: FixtureConfig = {
    name: 'add-api-prefix',
    source: {
        type: 'zip',
        path: 'add-api-prefix.zip',
    },
    query: {
        text: '把项目中所有的接口路径统一添加/api/v1前缀',
    },
    tests: [
        {
            name: 'file-content',
            minScore: 2,
            type: 'file',
            files: [
                {
                    path: 'src/main/java/com/example/demo/controller/UserController.java',
                    includes: ['/api/v1/bapi/user'],
                    score: 1,
                },
            ],
        },
    ],
};

export default fixture;
