# Change Log

## [UNRELEASED]

### Added

- 内置了一个`Open Oniichan Webview`命令打开Web面板，但我相信你不会需要这个的。

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
