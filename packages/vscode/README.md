# Oniichan Coding Assistant

Oniichan (おにいちゃん, 欧尼酱) is a very optionated coding assistant. I attempted to implement my creative ideas in the field of using large models to assist development within this plugin.

This plugin is not intended to provide basic features like code completion. It is a supplement to other AI coding plugins, not a replacement. For needs such as code completion and regular chat, you can use [Baidu Comate](https://comate.baidu.com/).

All features and UX of this plugin are thoroughly controlled by my personal preferences. If you have good ideas, we can discuss them together, but this work is by no means a commercial product, nor is it aimed at attracting more users.

Currently, this plugin only runs locally and will not send any telemetry data over the network. However, **for planning the quality of generation, there may be a possibility of collecting some data for model training in the future**, but it can be guaranteed that data collection will not be enabled by default, and there will be sufficient prompts and confirmations when it is enabled.

Speaking of which, who wouldn't love having a reliable Oniichan by their side while coding?

![Oniichan](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/cover-character.jpg)

## Configuration

Oniichan uses large models for code generation and utilizes the [OpenRouter](https://openrouter.ai) service.

In the configuration options, you can search for `oniichan.model` and fill in the relevant settings, including the API Key and model name.

For more details, please refer to the [installation configuration documentation](https://github.com/otakustay/oniichan/wiki/%E5%AE%89%E8%A3%85%E9%85%8D%E7%BD%AE).

## Features

### Semantic Rewrite

Semantic rewrite allows you to express your intentions in code using very simple and messy text and have them rewritten into semantically correct code by LLM (in the video, I triggered the rewrite using a shortcut key).

![Semantic rewrite demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/semantic-rewrite-styled.gif)

As shown in the video, as long as you can roughly describe the kind of CSS you want, semantic rewrite can quickly help you convert the code. During the process, you can even continue writing other code.

For more usage and related configurations, please refer to the [semantic rewrite documentation](https://github.com/otakustay/oniichan/wiki/%E8%AF%AD%E4%B9%89%E5%8C%96%E6%94%B9%E5%86%99).

### Scaffold Code Generation

Referring to the code structure of surrounding files, generate the `import` section, declaration of classes, function, and method for a new file, allowing you to quickly dive into business logic development.

![Scaffold demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/scaffold.gif)

It generates only module imports and method definitions, and does not arbitrarily fill in specific implementation code.

For more usage and related configurations, please refer to the [scaffold code generation documentation](https://github.com/otakustay/oniichan/wiki/%E9%AA%A8%E6%9E%B6%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90).

### Inbox System

A LLM agentic assistant in the form of email interaction, allowing you to invoke LLM on the spot. It can be opened in the sidebar or in a larger browser.

![Mail system demo](https://raw.githubusercontent.com/otakustay/oniichan/master/assets/mail-system.gif)

For usage, refer to the [mail system documentation](https://github.com/otakustay/oniichan/wiki/%E9%82%AE%E4%BB%B6%E7%B3%BB%E7%BB%9F).
