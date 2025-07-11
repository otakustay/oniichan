import {commands, Disposable, window} from 'vscode';
import {dataDirectory} from '@oniichan/shared/dir';
import open from 'open';

const WIKI_LINK = 'https://github.com/otakustay/oniichan/wiki/%E6%95%B0%E6%8D%AE%E5%AD%98%E5%82%A8';

export class OpenDataFolderCommand extends Disposable {
    private readonly disopsable: Disposable;

    constructor() {
        super(() => void this.disopsable.dispose());

        this.disopsable = commands.registerCommand(
            'oniichan.openDataFolder',
            async () => {
                const directory = await dataDirectory();

                if (directory) {
                    await open(directory);
                }
                else {
                    window.showErrorMessage(
                        '大概是权限问题吧，欧尼酱没办法往系统里写数据呢，所有需要存放数据的功能也会失效哦',
                        {
                            detail: `如果你觉得能修复一下权限问题，可以参考[数据存储文档](${WIKI_LINK})操作一下`,
                        }
                    );
                }
            }
        );
    }
}
