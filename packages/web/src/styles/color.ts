import {injectGlobal} from '@emotion/css';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
injectGlobal`
    :root {
        --color-root-background: var(--vscode-sideBar-background, #f8f8f8);
        --color-root-foreground: var(--vscode-editor-foreground, #3b3b3b);
        --color-modal-mask: var(--vscode-sideBar-dropBackground, rgba(0, 0, 0, 0.5));
        --color-default-background: var(--vscode-notifications-background, #fff);
        --color-default-background-hover: var(--vscode-sideBarSectionHeader-background, #f2f2f2);
        --color-default-foreground: var(--vscode-notifications-foreground, #3b3b3b);
        --color-default-border: var(--vscode-panel-border, #e5e5e5);
        --color-contrast-background: var(--vscode-tab-activeBackground, #f8f8f8);
        --color-contrast-foreground: var(--vscode-statusBar-background, #e50000);
        --color-secondary-foreground: var(--vscode-descriptionForeground, #666);
        --color-interactive-background: var(--vscode-button-background, #015eb8);
        --color-interactive-background-hover: var(--vscode-button-hoverBackground, #2e72c1);
        --color-interactive-background-active: var(--vscode-button-hoverBackground, #407bc6);
        --color-interactive-background-disabled: var(--vscode-button-secondaryBackground, #f8f8f8);
        --color-interactive-foreground: var(--color-button-foreground, #fff);
        --color-interactive-foreground-disabled: var(--vscode-button-secondaryForeground, #666);
        --color-link-foreground: var(--vscode-textLink-foreground, var(--color-interactive-background));
        --color-link-foreground-hover: var(--vscode-textLink-activeForeground, var(--color-interactive-background-hover));
        --color-link-foreground-active: var(--vscode-textLink-activeForeground, var(--color-interactive-background-active));
        --color-information: var(--vscode-notificationsInfoIcon, #1a85ff);
        --color-warn: var(--vscode-notificationsWarningIcon, #ddb100);
        --color-error: var(--vscode-notificationsErrorIcon, #b01011);
        --color-success: var(--vscode-notebookStatusSuccessIcon, #2da042);
        --color-notification-foreground: var(--vscode-foreground, #fff);
        --color-addition: var(--vscode-diffEditorGutter-insertedLineBackground, #2da042);
        --color-deletion: var(--vscode-diffEditorGutter-removedLineBackground, #e51600);
    }

   @media (prefers-color-scheme: dark) {
        :root {
            --color-root-background: var(--vscode-sideBar-background, #181818);
            --color-root-foreground: var(--vscode-editor-foreground, #ccc);
            --color-modal-mask: var(--vscode-sideBar-dropBackground, rgba(0, 0, 0, 0.7));
            --color-default-background: var(--vscode-notifications-background, #1f1f1f);
            --color-default-background-hover: var(--vscode-sideBarSectionHeader-background, #2b2d2e);
            --color-default-foreground: var(--vscode-notifications-foreground, #ccc);
            --color-default-border: var(--vscode-panel-border, #2b2b2b);
            --color-contrast-background: var(--vscode-tab-activeBackground, #181818);
            --color-contrast-foreground: var(--vscode-statusBar-background, #9cdcfe);
            --color-secondary-foreground: var(--vscode-descriptionForeground, #aaa);
            --color-interactive-background: var(--vscode-statusBar-background, #0078d4);
            --color-interactive-background-hover: var(--vscode-statusBarItem-hoverBackground, #4591dc);
            --color-interactive-background-active: var(--vscode-statusBarItem-activeBackground, #4391dc);
            --color-interactive-background-disabled: var(--vscode-statusBarItem-offlineBackground, #181818);
            --color-interactive-foreground: var(--color-statusBar-foreground, #fff);
            --color-interactive-foreground-disabled: var(--vscode-statusBarItem-offlineForeground, #ccc);
            --color-link-foreground: var(--vscode-textLink-foreground, var(--color-interactive-background));
            --color-link-foreground-hover: var(--vscode-textLink-activeForeground, var(--color-interactive-background-hover));
            --color-link-foreground-active: var(--vscode-textLink-activeForeground, var(--color-interactive-background-active));
            --color-information: var(--vscode-notificationsInfoIcon, #1a85ff);
            --color-warn: var(--vscode-notificationsWarningIcon, #ffcc01);
            --color-error: var(--vscode-notificationsErrorIcon, #f88070);
            --color-success: var(--vscode-notebookStatusSuccessIcon, #2da042);
            --color-notification-foreground: var(--vscode-foreground, #1f1f1f);
            --color-addition: var(--vscode-diffEditorGutter-insertedLineBackground, #2da042);
            --color-deletion: var(--vscode-diffEditorGutter-removedLineBackground, #8f1e1a);
        }
    }
`;
