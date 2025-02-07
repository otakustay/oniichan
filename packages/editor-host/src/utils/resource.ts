import {Disposable} from 'vscode';

export class ResourceManager implements Disposable {
    private readonly resources = new Set<Disposable>();

    addResource(resource: Disposable): void {
        this.resources.add(resource);
    }

    removeResource(resource: Disposable): void {
        this.resources.delete(resource);
    }

    dispose(): void {
        for (const resource of this.resources) {
            resource.dispose();
        }

        this.resources.clear();
    }
}
