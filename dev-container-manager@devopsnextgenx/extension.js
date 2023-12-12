import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { BaseContainer } from './extensions/container.js';
import { DockerMenu } from './extensions/docker/dockerMonitor.js';
import { KindCluster } from './extensions/kind/kindMonitor.js';

class DevContainerManager {
    constructor(extension) {
        this.container = new BaseContainer(extension);
        this.container.addMonitor(new DockerMenu('Docker Containers', 'docker-containers', extension));
        this.container.addMonitor(new KindCluster('Kind Clusters', 'kind-clusters', extension));
    }
    addToPanel() {
        Main.panel.addToStatusArea('DevContainerManager', this.container, -1, 'left');
        this.container.monitors.forEach(monitor => {
            Main.panel.menuManager.addMenu(monitor.menu);
            monitor.refresh();
        });
    }


    destroy() {
        this.container.monitors.forEach(monitor => monitor.destroy());
        this.container.destroy();
    }
}

export default class DevContainerManagerExtension extends Extension {
    constructor(metadata) {
        super(metadata);
    }

    enable() {
        this.devContainerManager = new DevContainerManager(this);
        this.devContainerManager.addToPanel();
    }

    disable() {
        this.devContainerManager.destroy();
        this.devContainerManager = null;
    }
}
