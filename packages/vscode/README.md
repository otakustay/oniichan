# Oniichan

Oniichan (おにいちゃん，欧尼酱)是我个人完全按照自己的喜好开发的一款VSCode插件，我试图将我在使用大模型辅助开发领域的创意实现在插件中。

本插件的所有交互、功能都彻底地受我个人偏好控制，如果你有好的想法，我们可以一起讨论，但本作绝非商业化产品，也绝非追求更多用户的产物。

话说回来，谁不爱写代码的时候有个可靠的欧尼酱陪着你呢。

![Oniichan](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/cover-character.jpg)

## 配置

Oniichan使用Claude大模型进行代码生成（具体使用`claude-3-5-sonnet-latest`），因此你需要配置Claude的API密钥才能使用插件。

在配置项中，你可以找到`oniichan.model.anthropicApiKey`填入你的Claude API密钥。

如果你使用一些代理服务，可以通过修改`oniichan.model.anthropicBaseUrl`来指定请求的路径，我个人使用[API2D](https://api2d.com/)服务，对应的配置值为`https://oa.api2d.net/claude/v1`。

更多细节请参考[安装配置文档](https://github.com/otakustay/oniichan/wiki/%E5%AE%89%E8%A3%85%E9%85%8D%E7%BD%AE)。

## 功能

### 语义化改写

语义化改写可以使你在代码中以非常简单、凌乱的文本表达自己的诉求，并通过大模型帮你改写成符合语义规范的代码（视频中我使用快捷键触发了改写）。

![Semantic rewrite demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/semantic-rewrite-styled.gif)

从视频中你可以看到，只要能大致讲明白要什么样的CSS，语义化改写就能很快地帮你转换代码，在运行过程中你甚至可以继续去写其它的代码。

更多使用方法及相关配置请参考[语义化改写文档](https://github.com/otakustay/oniichan/wiki/%E8%AF%AD%E4%B9%89%E5%8C%96%E6%94%B9%E5%86%99)。
