import type {FixtureConfig} from '../interface';

const fixture: FixtureConfig = {
    name: 'mall-add-we-chat-pay',
    source: {
        type: 'github',
        repo: 'git@github.com:macrozheng/mall.git',
        commit: '037314f9a244b3338022e23ec41e2c462fa8208d',
    },
    query: {
        text: '参考当前代码库的支付功能逻辑，增加微信支付功能（微信支付命名为WeChatPay）',
        references: [
            {
                type: 'file',
                file: 'mall-portal/src/main/java/com/macro/mall/portal/controller/AlipayController.java',
            },
            {type: 'file', file: 'mall-portal/src/main/java/com/macro/mall/portal/service/AlipayService.java'},
            {
                type: 'file',
                file: 'mall-portal/src/main/java/com/macro/mall/portal/service/impl/AlipayServiceImpl.java',
            },
            {type: 'file', file: 'mall-portal/src/main/java/com/macro/mall/portal/config/AlipayConfig.java'},
            {type: 'file', file: 'mall-portal/src/main/java/com/macro/mall/portal/config/AlipayClientConfig.java'},
            {type: 'file', file: 'mall-portal/src/main/java/com/macro/mall/portal/domain/AliPayParam.java'},
        ],
    },
    tests: [
        {
            name: 'git-diff',
            minScore: 25,
            type: 'git',
            files: [
                {
                    type: 'add',
                    path: 'mall-portal/src/main/java/com/macro/mall/portal/controller/WeChatPayController.java',
                    score: 5,
                },
                {
                    type: 'add',
                    path: 'mall-portal/src/main/java/com/macro/mall/portal/service/WeChatPayService.java',
                    score: 5,
                },
                {
                    type: 'add',
                    path: 'mall-portal/src/main/java/com/macro/mall/portal/service/impl/WeChatPayServiceImpl.java',
                    score: 5,
                },
                {
                    type: 'add',
                    path: 'mall-portal/src/main/java/com/macro/mall/portal/config/WeChatPayConfig.java',
                    score: 5,
                },
                {
                    type: 'add',
                    path: 'mall-portal/src/main/java/com/macro/mall/portal/domain/WeChatPayParam.java',
                    score: 5,
                },
                {
                    type: 'add',
                    path: 'mall-portal/src/main/java/com/macro/mall/portal/config/WeChatPayClientConfig.java',
                    score: 1,
                },
                {
                    type: 'modify',
                    path: 'mall-portal/src/main/resources/application.yml',
                    score: 1,
                },
                {
                    type: 'modify',
                    path: 'mall-portal/pom.xml',
                    score: 1,
                },
            ],
        },
    ],
};

export default fixture;
