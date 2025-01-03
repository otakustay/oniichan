# Change Log

## [UNRELEASED]

### Added

- Oniichan给邮件系统加了一个内置的系统提示词，至于效果好坏嘛慢慢调整。

## [1.7.0] - 2024-01-02

### Added

- 在邮箱系统中，为大模型添加读取文件、读取目录、查找文件3个工具。

### Fixed

- 发送邮件后，输入框会自动清空。
- 重启插件时，创建的线程会被正确清理。

## [1.6.1] - 2024-12-26

### Added

- 小小地补一下市场页面上的插件功能说明。

## [1.6.0] - 2024-12-26

### Added

- 一个以电子邮件为交互形态的大模型对话系统，可以在侧边栏、独立标签、浏览器中打开，具体参考[邮件系统](https://github.com/otakustay/oniichan/wiki/%E9%82%AE%E4%BB%B6%E7%B3%BB%E7%BB%9F)。

### Removed

原有的`Open Oniichan Webview`命令将不再显示模型用量的信息，由邮件系统的界面代替。

## [1.5.0] - 2024-12-19

### Added

- 在Output面板中加上了Oniichan的日志输出，就算用不了也能看看发生了什么。
- 增加了一个生成骨架代码的功能，新建一个文件后使用`Generate Scaffold Code`命令触发，会自动生成依赖导入和类、方法的定义，具体请参考[骨架代码生成文档](https://github.com/otakustay/oniichan/wiki/%E9%AA%A8%E6%9E%B6%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90)。

### Fixed

- 优化了任务过程中的资源管理，尽力避免任务结束资源没释放、加载动画没消失的情况。

## [1.4.0] - 2024-12-10

### Added

- 内置了一个`Open Oniichan Webview`命令打开Web面板，但我相信你不会需要这个的。
- 当你在一行正常的代码上触发语义化改写时，会尝试去修复这一行上的报错，要不试试看到波浪线就改写一发。

### Fixed

- 语义化改写设置为自动触发时，加上了一个更严格的触发判断，至少在我自己破产以前搞定了，具体规则可以参考[自动触发规则](https://github.com/otakustay/oniichan/wiki/%E8%AF%AD%E4%B9%89%E5%8C%96%E6%94%B9%E5%86%99#%E8%87%AA%E5%8A%A8%E8%A7%A6%E5%8F%91%E8%A7%84%E5%88%99)。

## [1.3.0] - 2024-12-09

### Added

- 可以从状态栏打开Oniichan的Web面板，暂时支持查看模型调用记录。

### Fixed

- 现在处于第一行时，语义化改写功能也会触发了。
- 用量数据的记录最新的会出现在最前面，只要`head`一下就能找看到啦。
- 日志记录的格式现在更加规范，当然你应该不需要关注这点。

## [1.2.0] - 2024-12-08

### Added

- 努力把功能使用和模型调用的数据记录在本地了，要查要统计咋都行。
- 增加了一个`Open Oniichan Data Folder`命令，方便看看都存了些啥玩意，具体请看[数据存储](https://github.com/otakustay/oniichan/wiki/%E6%95%B0%E6%8D%AE%E5%AD%98%E5%82%A8)。

## [1.1.1] - 2024-12-07

### Fixed

- 汗流浃背地赶紧修复了一处日志会把你的API Key打印出来的问题。

## [1.1.0] - 2024-12-07

### Added

- 支持了使用OpenAI或Anthropic形式的API，并可以自选模型，使用ChatGPT、Claude或者三方OpenRouter都毫无压力。

## [1.0.1] - 2024-12-06

### Added

- 精心（？）制作（？？）了插件的图标，现在亲爱的欧尼酱栩栩如生了。

### Fixed

- 切换编辑器标签页后，插件的语义化改写功能不会再莫名其妙失效了。

## [1.0.0] - 2024-12-06

### Added

- 完成插件的基础实现与[模型配置](https://github.com/otakustay/oniichan/wiki/%E5%AE%89%E8%A3%85%E9%85%8D%E7%BD%AE)。
- 支持[语义化改写](https://github.com/otakustay/oniichan/wiki/%E8%AF%AD%E4%B9%89%E5%8C%96%E6%94%B9%E5%86%99)。
