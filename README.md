# Oniichan

Oniichan (おにいちゃん，欧尼酱)是我个人完全按照自己的喜好开发的一款VSCode插件，我试图将我在使用大模型辅助开发领域的创意实现在插件中。

本插件的所有交互、功能都彻底地受我个人偏好控制，如果你有好的想法，我们可以一起讨论，但本作绝非商业化产品，也绝非追求更多用户的产物。

话说回来，谁不爱写代码的时候有个可靠的欧尼酱陪着你呢。

![Oniichan](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/cover-character.jpg)

## 配置

Oniichan使用Claude大模型进行代码生成（具体使用`claude-3-5-sonnet-latest`），因此你需要配置Claude的API密钥才能使用插件。

在配置项中，你可以找到`oniichan.model.anthropicApiKey`填入你的Claude API密钥。

如果你使用一些代理服务，可以通过修改`oniichan.model.anthropicBaseUrl`来指定请求的路径，我个人使用[API2D](https://api2d.com/)服务，对应的配置值为`https://oa.api2d.net/claude/v1`。

## 功能

### 语义化重写

语义化重写可以使你在代码中以非常简单、凌乱的文本表达自己的诉求，并通过大模型帮你改写成符合语义规范的代码（视频中我使用快捷键触发了重写）。

![Semantic rewrite demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/semantic-rewrite-styled.gif)

从视频中你可以看到，只要能大致讲明白要什么样的CSS，语义化重写就能很快地帮你转换代码，在运行过程中你甚至可以继续去写其它的代码。

再举一个例子，我有一个单元测试的文件：

```ts
import {expect, test} from 'vitest';
import {chunk} from '../chunk.js';

async function* generate() {
    yield 1;
    await Promise.resolve();
    yield 2;
    yield 3;
    await Promise.resolve();
    yield 4;
    yield 5;
}
test('chunk with size 2', async () => {
    const iterable = chunk(generate(), 2);
    const iterator = iterable[Symbol.asyncIterator]();
    await expect(iterator.next()).resolves.toEqual({value: [1, 2], done: false});
    await expect(iterator.next()).resolves.toEqual({value: [3, 4], done: false});
    await expect(iterator.next()).resolves.toEqual({value: [5], done: false});
    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});
});

tst size < 0 // <-- 在这一行触发
```

非常简单的说明一下我要添加一个测试用例，然后执行`Semantic rewrite current line`这个命令，它就会变成这样的代码：

```ts
test('chunk with negative size', async () => {
    expect(() => chunk(generate(), -1)).toThrow();
});
```

还是比较能满足实际代码的需要的。

### 触发方式

- 你可以使用`CMD+SHIFT+P`打开命令面板，找到`Semantic rewrite current line`来触发语义化重写。
- 默认的快捷键是`CMD+SHIFT+R`，需要修改的话，在快捷键配置中找到`oniichan.semanticRewrite`修改即可。
- 如果在设置中，`oniichan.semanticRewrite.triggerType`这个配置的值是`Automatic`，那么在一行末尾敲回车的时候，会自动在这一行触发重写，这可能会导致更多不需要重写的代码发送给模型，消耗你的钱包，还请小心。
