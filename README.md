# Oniichan Coding Assistant

This is the main repository for the [Oniichan Coding Assistant](https://marketplace.visualstudio.com/items?itemName=otakustay.oniichan) extension.

## Project Structure

- `shared`: Code for shared use, including model access, utility functions, shared types, etc.
- `prompt`: Manages prompt words for all features.
- `kernel`: Contains the core logic decoupled from the VSCode API. It is designed to work in independent environments (threads, processes, or even remotely).
- `editor-host`: Exposes the VSCode capabilities needed by the core logic to the `kernel` module.
- `storage`: Provides the ability to persist data locally. Anything related to persistence must use the functions here; writing files or databases directly is not allowed.
- `web`: A React application that communicates with the server via WebSocket after being packaged. You can open a web page through the plugin to use it.
- `web-host`: Exposes capabilities in the web system for IDE, `kernel`, etc., essentially services for externally controlling page elements.
- `vscode`: Source code for the VSCode extension.
- `eval`: An independent CLI that reuses the `kernel` module for automated task evaluation, equivalent to a headless version of the actual IDE plugin.

> Why such a complex structure?

This project not only provides features I find useful but also serves as a validation of a technical solution:

- If my `kernel` can run in a separate process, I can achieve logic reuse across multiple IDEs like VSCode and JetBrains.
- If it can run in an independent process and also provide CLI calls or listen to an HTTP port, it can be accessed by more non-IDE applications.
- This could lead to the creation of an application similar to ChatGPT Desktop that is not bound to only integrate with VSCode.
- I could even run the IDE and `kernel` remotely and use a browser to access the services provided by the `kernel`, creating a general Q&A bot based on code repositories in a code hosting system.

Therefore, this project naturally allows the logic decoupled from the IDE to run in a separate environment through the `kernel` module (although it currently runs in the same process as VSCode, it can be easily switched), and uses `host` to connect VSCode with `kernel` (if connecting to JetBrains, just implement the same interface).

## Release Process

1. Update `packages/vscode/CHANGELOG.md` to manually maintain the changelog.
2. Run `npm run release` to automatically update the version number and generate commits and tags.
3. Execute `vsce publish --no-dependencies` in the `packages/vscode` directory to publish.
