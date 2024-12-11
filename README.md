# Oniichan Coding Assistant

此处为[Oniichan Coding Assistant](https://marketplace.visualstudio.com/items?itemName=otakustay.oniichan)扩展的主仓库。

## 项目结构

- `shared`：共享用的代码，包括模型访问、工具函数、共享类型等。
- `vscode`：VSCode扩展的源码。
- `kernel`：包含了解耦VSCode API后的核心逻辑，它被设计为可以工作在独立的环境（线程、进程、甚至远端）中。
- `host`：将核心逻辑需要的VSCode的能力暴露给`kernel`模块。
- `storage`：在本地持久化数据的能力，只要和持久化有关的，必须使用这里面的功能，不得自己写文件、数据库。
- `web`：一个React应用，打完包以后通过WebSocket和服务端通信，可以通过插件打开Web页面使用。
- `server`：一个Fastify的服务，最终在VSCode扩展里启动，它会与VSCode、文件系统交互，提供一个WebSocket服务出来，并把`web`模块的产出作为静态文件输出。

> 为什么要做这么复杂的结构？

这个项目不仅仅是提供我自己觉得好用的功能，同时也是一种技术方案的验证：

- 如果我的`kernel`可以跑在单独的进程中，我就能实现VSCode和JetBrains等多种IDE的逻辑复用。
- 如果不仅跑在独立进程中，还能提供CLI的调用或者监听一个HTTP端口，那么它就能被更多非IDE的应用访问。
- 那么就有可能实现一个类似ChatGPT Desktop的应用，且不绑定只能与VSCode对接。
- 甚至我可以让IDE和`kernel`跑在远程，再用浏览器去访问`kernel`提供的服务，在代码托管的系统上做出来一个基于代码库的通用问答机器人。

所以，这个项目天然通过`kernel`模块让与IDE解耦的逻辑跑在单独的环境中（虽然现在依然与VSCode同进程，但可以很方便地切换），用`host`实现VSCode与`kernel`的对接（如果要对接JetBrains，实现相同的接口即可）。

## 发布流程

1. 更新`packages/vscode/CHANGELOG.md`手动维护更新日志。
2. 运行`npm run release`自动更新版本号并生成提交与标签。
3. 在`packages/vscode`目录下执行`vsce publish --no-dependencies`发布。
