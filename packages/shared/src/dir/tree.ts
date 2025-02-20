import {sortedInsert} from '../array';

interface Entry {
    name: string;
    type: 'file' | 'directory';
}

interface Node extends Entry {
    children: Node[];
}

function insertNode(entries: Entry[], from: Node): boolean {
    const [current, ...children] = entries;

    if (!children.length) {
        const exists = from.children.find(v => v.name === current.name);
        if (!exists) {
            const newNode = {...current, children: []};
            sortedInsert(from.children, newNode, (x, y) => x.name.localeCompare(y.name));
        }
        return !exists;
    }

    const currentNode = from.children.find(v => v.name === current.name);

    if (currentNode) {
        return insertNode(children, currentNode);
    }
    else {
        const newNode = {...current, children: []};
        sortedInsert(from.children, newNode, (x, y) => x.name.localeCompare(y.name));
        insertNode(children, newNode);
        return true;
    }
}

function deleteNode(entries: Entry[], from: Node): boolean {
    const [current, ...children] = entries;

    if (!children.length) {
        const index = from.children.findIndex(v => v.name === current.name);
        const deleted = index >= 0;
        if (deleted) {
            from.children.splice(index, 1);
        }
        return deleted;
    }

    const child = from.children.find(v => v.name === current.name);

    return child ? deleteNode(children, child) : false;
}

function splitToEntries(file: string): Entry[] {
    const type = file.endsWith('/') ? 'directory' : 'file';
    const toEntry = (name: string, index: number, array: string[]): Entry => {
        return {
            name,
            type: index === array.length - 1 ? type : 'directory',
        };
    };
    const entries = file.replace(/\/+$/, '').split('/').map(toEntry);
    return entries;
}

interface TreeifyOptions {
    /**
     * A function to filter out nodes that should not be displayed
     *
     * @param children Child nodes
     * @returns An array of indices of nodes that should be displayed
     */
    filterChildren: (children: Node[]) => number[];
    maxLines: number;
}

export interface TreeifyResult {
    tree: string;
    truncated: boolean;
}

function treeify(nodes: Node[], options: TreeifyOptions): TreeifyResult {
    const output = new Set<string>();
    const stripableLines: string[] = [];
    const intoOutput = (node: Node, indent: number, prefix: string, stripable: boolean) => {
        const indentString = ' '.repeat(indent * 2);
        const display = node.type === 'directory' ? node.name + '/' : node.name;

        if (node.children.length === 1 && node.children[0].type === 'directory') {
            intoOutput(node.children[0], indent, prefix + display, false);
            return;
        }

        const line = indentString + prefix + display;
        output.add(line);
        if (stripable) {
            stripableLines.push(line);
        }

        const requiredChildrenIndex = new Set(options.filterChildren(node.children));
        for (const [index, child] of node.children.entries()) {
            intoOutput(child, indent + 1, '', !requiredChildrenIndex.has(index));
        }
    };
    for (const child of nodes) {
        intoOutput(child, 0, '', false);
    }

    if (output.size <= options.maxLines) {
        return {
            tree: [...output].join('\n'),
            truncated: false,
        };
    }

    for (const line of stripableLines) {
        output.delete(line);
    }

    return {
        tree: [...output].slice(0, options.maxLines).join('\n'),
        truncated: true,
    };
}

export class WorkspaceFileStructure {
    static readonly containerKey = 'workspaceFileStructure';

    private readonly root: Node = {name: '', type: 'directory', children: []};

    add(file: string) {
        const entries = splitToEntries(file);
        return insertNode(entries, this.root);
    }

    delete(file: string) {
        const entries = splitToEntries(file);
        return deleteNode(entries, this.root);
    }

    toTreeString() {
        const {tree} = treeify(
            this.root.children,
            {
                filterChildren: children => Object.keys(children).map(v => parseInt(v, 10)),
                maxLines: Number.MAX_SAFE_INTEGER,
            }
        );
        return tree;
    }

    toArray() {
        const output: string[] = [];
        const intoOutput = (node: Node, prefix: string) => {
            const display = prefix + (node.type === 'directory' ? node.name + '/' : node.name);
            output.push(display);

            for (const child of node.children) {
                intoOutput(child, display);
            }
        };
        for (const child of this.root.children) {
            intoOutput(child, '');
        }
        return output;
    }

    count() {
        const sum = {value: 0};
        const add = (node: Node) => {
            sum.value++;

            for (const child of node.children) {
                add(child);
            }
        };
        for (const child of this.root.children) {
            add(child);
        }
        return sum.value;
    }

    toOverviewStructure() {
        const filterChildren = (children: Node[]): number[] => {
            const includes: number[] = [];
            const filesVisited = {count: 0};
            for (const [index, child] of children.entries()) {
                if (child.type === 'directory') {
                    includes.push(index);
                }
                else if (filesVisited.count < 5) {
                    filesVisited.count++;
                    includes.push(index);
                }
            }
            return includes;
        };
        return treeify(this.root.children, {filterChildren, maxLines: 200});
    }
}
