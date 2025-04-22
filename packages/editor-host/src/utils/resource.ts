import type {Disposable} from 'vscode';
import {Logger} from '@oniichan/shared/logger';
import type {DependencyContainer} from '@oniichan/shared/container';

export interface ResourceManagerDependency {
    [Logger.containerKey]: Logger;
}

export class ResourceManager implements Disposable {
    static readonly containerKey: 'ResourceManager';

    private readonly resources = new Set<Disposable>();

    private readonly logger: Logger;

    constructor(container: DependencyContainer<ResourceManagerDependency>) {
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
