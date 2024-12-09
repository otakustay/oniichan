# Oniichan Coding Assistant

此处为[Oniichan Coding Assistant](https://marketplace.visualstudio.com/items?itemName=otakustay.oniichan)扩展的主仓库。

## 分包介绍

- `shared`：共享用的代码，包括模型访问、工具函数、共享类型等。
- `vscode`：VSCode扩展的源码。
- `storage`：在本地持久化数据的能力，只要和持久化有关的，必须使用这里面的功能，不得自己写文件、数据库。
- `web`：一个React应用，打完包以后通过WebSocket和服务端通信，可以通过插件打开Web页面使用。
- `server`：一个Fastify的服务，最终在VSCode扩展里启动，它会与VSCode、文件系统交互，提供一个WebSocket服务出来，并把`web`模块的产出作为静态文件输出。

## 发布流程

1. 更新`packages/vscode/CHANGELOG.md`手动维护更新日志。
2. 运行`npm run release`自动更新版本号并生成提交与标签。
3. 在`packages/vscode`目录下执行`vsce publish --no-dependencies`发布。
