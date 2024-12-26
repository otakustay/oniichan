# Oniichan Coding Assistant

Oniichan (おにいちゃん，欧尼酱)是我个人完全按照自己的喜好开发的一款VSCode插件，我试图将我在使用大模型辅助开发领域的创意实现在插件中。

本插件不打算提供代码续写之类的基础功能，这是一个其它AI编码插件的补充，而不是替代。对于续写、普通对话等功能有需求的，可以使[文心快码Comate](https://comate.baidu.com/)。

本插件的所有交互、功能都彻底地受我个人偏好控制，如果你有好的想法，我们可以一起讨论，但本作绝非商业化产品，也绝非追求更多用户的产物。

本插件当前仅运行于本地，不会向网络发送任务数据。但**出于对生成质量的规划，后续会有采集部分数据用于模型训练的可能性**，但可以保证数据采集默认不会开启，开启时一定会有足够的提示与确认。

话说回来，谁不爱写代码的时候有个可靠的欧尼酱陪着你呢。

![Oniichan](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/cover-character.jpg)

## 配置

Oniichan使用大模型进行代码生成，支持OpenAI（ChatGPT、OpenRouter等服务）与Anthropic（Claude等服务）两种形式，你需要有自己的API Key。

在配置项中，你可以搜索`oniichan.model`并填入相关的配置，包括API形式、入口URL、API Key、模型名称等。

如果你使用一些代理服务，可以通过修改`oniichan.model.baseUrl`来指定请求的路径，例如我个人使用[API2D](https://api2d.com/)服务，并调用Claude的模型，则对应的配置值为`https://oa.api2d.net/claude/v1`。

更多细节请参考[安装配置文档](https://github.com/otakustay/oniichan/wiki/%E5%AE%89%E8%A3%85%E9%85%8D%E7%BD%AE)。

## 功能

### 语义化改写

语义化改写可以使你在代码中以非常简单、凌乱的文本表达自己的诉求，并通过大模型帮你改写成符合语义规范的代码（视频中我使用快捷键触发了改写）。

![Semantic rewrite demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/semantic-rewrite-styled.gif)

从视频中你可以看到，只要能大致讲明白要什么样的CSS，语义化改写就能很快地帮你转换代码，在运行过程中你甚至可以继续去写其它的代码。

更多使用方法及相关配置请参考[语义化改写文档](https://github.com/otakustay/oniichan/wiki/%E8%AF%AD%E4%B9%89%E5%8C%96%E6%94%B9%E5%86%99)。

### 骨架代码生成

参考周边文件的代码结构，生成一个新文件的`import`部分代码、各种类、函数、方法定义等，使你快速进入业务逻辑的开发。

![Scaffold demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/scaffold.gif)

非常节制地只生成模块导入、方法定义，而不会擅自填写低准确率的具体的实现代码。

更多使用方法及相关配置请参考[骨架代码生成文档](https://github.com/otakustay/oniichan/wiki/%E9%AA%A8%E6%9E%B6%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90)。

### 邮件系统

一个以邮件收发为交互形态的大模型对话助手，可以让你在第一现场调用大模型。支持在侧边栏或更大的浏览器中打开。

![Mail system demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/mail-system.gif)

使用方法参考[邮件系统文档](https://github.com/otakustay/oniichan/wiki/%E9%82%AE%E4%BB%B6%E7%B3%BB%E7%BB%9F)。
