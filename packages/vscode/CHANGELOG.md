# Change Log

## [3.7.0] - 2025-05-28

- Added Henshin mode, where Oniichan can intelligently switch to different role to complete different tasks.
- Added Senpai mode, which performs more active validation after task completion to improve quality.
- When opening the diff view, it automatically scrolls to the first change block.

### Fixed

- Incorrect file edits would cause subsequent edits to the same file to consistently fail.

## [3.6.0] - 2025-04-09

### Added

- In the mail system, the file changes summary area has a larger clickable range for viewing file changes.
- Use OpenRouter interface to obtain accurate model usage data, view details by using "Open Oniichan Data Folder" command and opening `model-usage.jsonl`.
- Save more model costs by early termination of useless model response streams.

### Fixed

- Fixed text color in mail input box in dark theme.
- Fixed background color when using `#` to reference files in mail input box in dark theme.
- Fixed inability to use `#` to reference files when sending mail messages after first opening the sidebar.

## [3.5.0] - 2025-03-21

### Added

- Added Couple mode to the mail system, a cost-focused mode that maintains code generation quality, see [Use Couple Mode To Dramatically Reduce Cost](https://github.com/otakustay/oniichan/discussions/41) for details.
- Model now has the ability to read multiple files at once, continuing to save money~

### Fixed

- Fixed issue where parsing order was incorrect when read and write tasks intersect in the plan.

## [3.4.0] - 2025-03-18

### Added

- Added Ring Ring mode to the mail system, which divides tasks into planning, action, and programming parts. This mode has significant cost advantages, see [Announcing RingRing Mode](https://github.com/otakustay/oniichan/discussions/39) for details.

### Removed

- Removed experimental "Deep Think" feature, which was terrible in both experience and production quality.

## [3.3.0] - 2025-02-27

### Added

- Added "Initialize Project Config" command to quickly initialize Oniichan configuration file in the project.
- Now you can use Rules to control mail system response effects by modifying `.oniichan/rules/default.omd`.
- You can write requirements directly in the code editor and use "Send This Line To Inbox" command to send to the mail system. When writing in comments, use "`" symbol to auto-complete elements in the file.
- Added configuration to control automatic execution of large model generated commands. You can exclude certain commands which will require manual confirmation when auto-execution is selected, and auto-execute when not selected. Search for `oniichan.inbox` in settings to find configuration.
- When auto-execute commands configuration has no exclusion list, a series of high-risk commands are built-in for manual confirmation.

### Fixed

- Fixed issue of losing some directories when extracting project file structure.

## [3.2.0] - 2025-02-24

### Added

- Mail system supports rolling back to historical message states in one conversation, undoing all file edits from new messages.

### Fixed

- Resolved issue where "Compose New Message" command couldn't pop up editor when Oniichan sidebar was never opened.

## [3.1.0] - 2025-02-23

### Added

- Added "deep thinking" option to mail system, introducing DeepSeek R1 for preliminary thinking when using any model.

### Fixed

- Fixed broken scaffold functionality.
- No longer allowing models any chance to use multiple tools in one response.
- Fixed issue with tracking file additions and deletions in workspace.

## [3.0.1] - 2025-02-21

### Fixed

- Hide review entry during file edit generation in mail messages.
- Re-optimized installation package size.

## [3.0.0] - 2025-02-21

### Breaking

- Starting from this version, the mail system will actively modify project file content, changes can be undone through "Reject".

### Added

- Mail system tracks whether recommended code is adopted, providing notifications if file content differs from recommendations when replying.
- Can use `#` to reference files and directories when writing mail.
- Model-output project file names in mail system are now clickable and can be opened.
- Optimized project file structure processing, models now have more accurate knowledge of project file and directory structure and distribution, providing more accurate generation.
- Added file edit summary at the top of mail messages for each task round, supporting sequential review and individual or bulk adoption/rollback.

### Fixed

- Resolved issue of oversized plugin installation package due to poor implementation.
- Optimized code block styles in messages.

## [2.4.0] - 2025-02-18

### Added

- Model file content retrieval is more precise and faster.
- More friendly interface display for adopted file edits.
- Support multiple modifications to the same file in one conversation.

### Fixed

- Improved plugin stability with some recovery capability during fatal errors.
- Fixed cases where code edits couldn't be viewed or adopted.
- Resolved memory residue issues when closing mail system in browser.

## [2.3.0] - 2025-02-16

### Added

- Oniichan now remembers snapshots before editing files, each modification can be reviewed and applied repeatedly.
- Supports DeepSeek R1 model's deep thinking process, more thinking might fry Oniichan's brain.
- Optimized UI display for command line task execution, making commands more prominent to avoid missing important things.
- Completely rewrote model file editing strategy and logic, each edit now serves as a checkpoint with file content saved before and after editing, unaffected by other modifications.

### Fixed

- Shows error prompt without modifying file when viewing or adopting file edits if file has been modified.
- Formally restored mail system interaction, latest messages appear at top.
- Fixed interface error when replying to mail.
- Optimized implementation of keyword and wildcard file search.
- Added internal repair process for model-generated patches that can't correctly edit files, generating more stable and accurate patches.
- Fixed incorrect line count display for added and deleted lines in file edits.

## [2.2.0] - 2025-02-13

### Added

- When using mail system in empty directory, Oniichan will seriously create an engineered project structure, no more random writing.
- Similarly, when creating web applications in empty directory, Oniichan will automatically open browser preview.
- Look carefully at messages in mail system, Oniichan now secretly writes what it's doing at the end.

### Fixed

- Further improved mail system code editing stability, occasional "Not Appliable" errors should rarely appear.
- Better handling of non-exiting commands (like starting servers) during execution, allowing faster progression to next step.

## [2.1.1] - 2025-02-10

### Fixed

- Optimized configuration migration during version upgrade, no longer creating extra `.vscode` directory.
- Slightly adjusted tool command line task timeout for more accurate execution results.

## [2.1.0] - 2025-02-07

### Added

- Seems like added quite a few tools for the model, your dear Oniichan now has semi-automatic code writing capability, but be careful of automatic command execution.
- Added functionality to export current inbox data using `Export Inbox Data` command.

### Fixed

- Completely rewrote tool invocation pattern, tool usage and effects should have major improvements.

## [2.0.0] - 2025-01-15

### Removed

- Give the little one a break, can't write anymore, restricted model provider to support only OpenRouter.

## [1.9.0] - 2025-01-14

### Added

- Split-pane layout when opening Oniichan in web, big screens deserve big screen enjoyment.
- Use `SHIFT + N` for new message, `SHIFT + R` for reply in inbox system.

### Fixed

- Finally got models to output diff format, no more wallet pain from large files or worry about models skipping code.
- Strictly trained models, now non-Claude models also provide thinking process when calling tools.
- Fixed message jumping issue in inbox during model generation.

## [1.8.0] - 2025-01-06

### Added

- Oniichan added built-in system prompts to mail system, effectiveness to be gradually adjusted.
- Inbox now has Composer-like functionality, can edit, create, delete files, slight quality issues but released for testing.

## [1.7.0] - 2025-01-02

### Added

- Added read file, read directory, find file tools for large models in inbox system.

### Fixed

- Input box auto-clears after sending mail.
- Threads properly cleaned up when restarting plugin.

## [1.6.1] - 2024-12-26

### Added

- Minor supplement to plugin functionality description on marketplace page.

## [1.6.0] - 2024-12-26

### Added

- An email-based large model dialogue system, accessible in sidebar, standalone tab, or browser, see [Mail System](https://github.com/otakustay/oniichan/wiki/%E9%82%AE%E4%BB%B6%E7%B3%BB%E7%BB%9F).

### Removed

Original `Open Oniichan Webview` command no longer shows model usage information, replaced by mail system interface.

## [1.5.0] - 2024-12-19

### Added

- Added Oniichan log output in Output panel to track issues.
- Added scaffold code generation feature, triggered by `Generate Scaffold Code` command after creating new file, automatically generates dependency imports and class/method definitions, see [Scaffold Code Generation Documentation](https://github.com/otakustay/oniichan/wiki/%E9%AA%A8%E6%9E%B6%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90).

### Fixed

- Optimized task process resource management to avoid resource retention and loading animation persistence.

## [1.4.0] - 2024-12-10

### Added

- Built-in `Open Oniichan Webview` command to open Web panel, though you probably won't need it.
- When triggering semantic rewrite on normal code line, attempts to fix errors on that line, try rewriting when you see wavy lines.

### Fixed

- Added stricter trigger judgment for automatic semantic rewrite, fixed before personal bankruptcy, see [Automatic Trigger Rules](https://github.com/otakustay/oniichan/wiki/%E8%AF%AD%E4%B9%89%E5%8C%96%E6%94%B9%E5%86%99#%E8%87%AA%E5%8A%A8%E8%A7%A6%E5%8F%91%E8%A7%84%E5%88%99).

## [1.3.0] - 2024-12-09

### Added

- Can open Oniichan Web panel from status bar, currently supports viewing model call records.

### Fixed

- Semantic rewrite now triggers when on first line.
- Latest usage data appears first, easily found with `head`.
- More standardized log record format, though you probably don't need to care about this.

## [1.2.0] - 2024-12-08

### Added

- Successfully recorded feature usage and model call data locally for querying and statistics.
- Added `Open Oniichan Data Folder` command for easy data access, see [Data Storage](https://github.com/otakustay/oniichan/wiki/%E6%95%B0%E6%8D%AE%E5%AD%98%E5%82%A8).

## [1.1.1] - 2024-12-07

### Fixed

- Quickly fixed issue where logs could expose your API Key.

## [1.1.0] - 2024-12-07

### Added

- Supports OpenAI or Anthropic-style APIs with model selection, seamlessly works with ChatGPT, Claude, or third-party OpenRouter.

## [1.0.1] - 2024-12-06

### Added

- Carefully(?) crafted(??) plugin icon, now dear Oniichan looks lifelike.

### Fixed

- Semantic rewrite functionality no longer mysteriously fails after switching editor tabs.

## [1.0.0] - 2024-12-06

### Added

- Completed basic plugin implementation and [model configuration](https://github.com/otakustay/oniichan/wiki/%E5%AE%89%E8%A3%85%E9%85%8D%E7%BD%AE).
- Supports [semantic rewrite](https://github.com/otakustay/oniichan/wiki/%E8%AF%AD%E4%B9%89%E5%8C%96%E6%94%B9%E5%86%99).
