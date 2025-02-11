import {Disposable} from 'vscode';
import {Logger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';

interface Dependency {
    [Logger.containerKey]: Logger;
}

export class ResourceManager implements Disposable {
    private readonly resources = new Set<Disposable>();

    private readonly logger: Logger;

    constructor(container: DependencyContainer<Dependency>) {
        this.logger = container.get(Logger).with({source: 'ResourceManager'});
    }

    addResource(resource: Disposable): void {
        this.logger.trace('AddResource');
        this.resources.add(resource);
    }

    removeResource(resource: Disposable): void {
        this.logger.trace('RemoveResource');
        this.resources.delete(resource);
    }

    dispose(): void {
        for (const resource of this.resources) {
            resource.dispose();
        }

        this.resources.clear();
    }
}
