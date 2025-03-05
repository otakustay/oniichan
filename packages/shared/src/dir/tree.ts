function sortedInsert<T>(array: T[], item: T, compare: (x: T, y: T) => number): void {
    const index = array.findIndex(i => compare(item, i) < 0);
    array.splice(index < 0 ? array.length : index, 0, item);
}

const INDIRECT_INDENT_STRING = '│   ';

const DIRECT_INDENT_STRING = '├── ';

function sortEntry(x: Entry, y: Entry) {
    if (x.type !== y.type) {
        return x.type === 'directory' ? -1 : 1;
    }

    return x.name.localeCompare(y.name);
}

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
            sortedInsert(from.children, newNode, sortEntry);
        }
        return !exists;
    }

    const currentNode = from.children.find(v => v.name === current.name);

    if (currentNode) {
        return insertNode(children, currentNode);
    }
    else {
        const newNode = {...current, children: []};
        sortedInsert(from.children, newNode, sortEntry);
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
    totalCount: number;
    truncatedCount: number;
}

interface TreeifyNode {
    indent: number;
    text: string;
    strippable: boolean;
    children: TreeifyNode[];
}

function indentString(indent: number) {
    return indent ? INDIRECT_INDENT_STRING.repeat(indent - 1) + DIRECT_INDENT_STRING : '';
}

function treeToLines(root: TreeifyNode, strip: boolean) {
    const output: string[] = [];
    const intoOutput = (node: TreeifyNode) => {
        output.push(indentString(node.indent) + node.text);

        const children = strip ? node.children.filter(v => !v.strippable) : node.children;
        for (const child of children) {
            intoOutput(child);
        }

        const strippedCount = node.children.length - children.length;
        if (strippedCount > 0) {
            output.push(`${indentString(node.indent + 1)}(...${strippedCount} files not shown)`);
        }
    };
    intoOutput(root);
    return output;
}

function treeify(nodes: Node[], options: TreeifyOptions): TreeifyResult {
    const counter = {
        totalCount: 1,
        strippableCount: 0,
    };
    const output: TreeifyNode = {indent: 0, text: '.', strippable: false, children: []};
    const intoOutput = (nodeIn: Node, parent: TreeifyNode, indent: number, prefix: string, strippable: boolean) => {
        const display = nodeIn.type === 'directory' ? nodeIn.name + '/' : nodeIn.name;

        if (nodeIn.children.length === 1 && nodeIn.children[0].type === 'directory') {
            intoOutput(nodeIn.children[0], parent, indent, prefix + display, false);
            return;
        }

        const nodeOut: TreeifyNode = {indent, text: prefix + display, strippable, children: []};
        parent.children.push(nodeOut);
        counter.strippableCount += strippable ? 1 : 0;
        counter.totalCount++;

        const requiredChildrenIndex = new Set(options.filterChildren(nodeIn.children));
        for (const [index, child] of nodeIn.children.entries()) {
            intoOutput(child, nodeOut, indent + 1, '', !requiredChildrenIndex.has(index));
        }
    };
    for (const child of nodes) {
        intoOutput(child, output, 1, '', false);
    }

    if (counter.totalCount <= options.maxLines) {
        const lines = treeToLines(output, false);
        return {
            tree: lines.join('\n'),
            totalCount: counter.totalCount,
            truncatedCount: 0,
        };
    }

    const lines = treeToLines(output, true);
    if (lines.length <= options.maxLines) {
        return {
            tree: lines.join('\n'),
            totalCount: counter.totalCount,
            truncatedCount: counter.strippableCount,
        };
    }

    // TODO: Return empty string if no entries

    // One line for tailing indication
    const sliceEnd = options.maxLines - 1;
    const slicedCount = lines.length - sliceEnd;
    return {
        tree: lines.slice(0, sliceEnd).concat(`(...approximately ${slicedCount} lines not shown)`).join('\n'),
        totalCount: counter.totalCount,
        truncatedCount: counter.strippableCount + slicedCount,
    };
}

export class WorkspaceFileStructure {
    static readonly containerKey = 'workspaceFileStructure';

    private readonly root: Node = {name: '.', type: 'directory', children: []};

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
