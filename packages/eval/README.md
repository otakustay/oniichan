# Automated Evaluation

This package provides an automated evaluation CLI for Inbox system.

This works only in macOS (or maybe Linux).

## Run

To run all test cases, use:

```
tsx src/main.ts
```

If you want to run one or some specific test cases, modify `src/main.ts` to filter test cases by their names.

## Report

Each test case will list its result in the console, this is an example:

```
✔ async-iterator-delete-debounce (7 messages)
  ✔ git-diff 11/13
    ✔ delete src/helper/operators/debounce.ts
    ✔ delete src/helper/operators/__tests__/debounce.test.ts
    ✔ modify src/helper/index.ts
    ✖ modify src/helper/__tests__/index.test.ts
    ✖ modify README.md
✔ breeze-forest-add-distribution (7 messages)
  ✔ distribution-score 1/1
    ✔ score: 1.0
```
