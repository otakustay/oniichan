# Oniichan Coding Assistant

此处为[Oniichan Coding Assistant](https://marketplace.visualstudio.com/items?itemName=otakustay.oniichan)扩展的主仓库。

## 分包介绍

- `shared`：共享用的代码，包括模型访问、工具函数、共享类型等。
- `vscode`：VSCode扩展的源码。

## 发布流程

1. 更新`packages/vscode/CHANGELOG.md`手动维护更新日志。
2. 运行`npm run release`自动更新版本号并生成提交与标签。
3. 在`packages/vscode`目录下执行`vsce publish`发布。
