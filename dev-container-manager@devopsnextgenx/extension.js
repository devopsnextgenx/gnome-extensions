import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { BaseContainer } from './extensions/container.js';
import { DockerMenu } from './extensions/docker/dockerMonitor.js';
import { KindCluster } from './extensions/kind/kindMonitor.js';
import { checkDependencies, getMissingDependencies } from './extensions/base/systemInterface.js';

const _this = {}

export const getExtensionObject = () => { return _this['extension'] };

class DevContainerManager {
    constructor(dependencies) {
        this.container = new BaseContainer();
        this.container.addMonitor(new DockerMenu('Docker Containers', 'docker-containers'));
        
        const missingKind = !dependencies.hasKind;
        missingKind && Main.notifyError(`[dev-container-manager] missing dependencies`, 'Install kind in order to create and handle the clusters using docker/podman.');
        !missingKind && this.container.addMonitor(new KindCluster('Kind Clusters', 'kind-clusters'))
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
        _this['extension'] = this;
        console.log(`[${this.metadata.name}] enabling version ${this.metadata.version}`);
        const dependencies = checkDependencies();
        const missingContainerLib = !dependencies.hasDocker && !dependencies.hasPodman;
        if (missingContainerLib) {

            let missingLibs = getMissingDependencies(dependencies);
            let msg = _(`It looks like your computer is missing following libraries: ${missingLibs.join(', ')}\n\nAfter installing them, you'll need to restart your computer.`);
            Main.notifyError(`[${this.metadata.name}] missing dependencies`, msg);

            // console.log(`[${this.metadata.name}] missing dependencies, showing problem reporter instead`);
            // this.devContainerManager = new ProblemReporter(this.metadata);
            

            // this.devContainerManager.setMessage(msg);

            // Main.panel.addToStatusArea(`${this.metadata.name} Problem Reporter`, this.devContainerManager, -1, 'left');
        } else {
            this.devContainerManager = new DevContainerManager(dependencies);
            this.devContainerManager.addToPanel();
        }
    }

    disable() {
        _this['extension'] = null;
        this.devContainerManager.destroy();
        this.devContainerManager = null;
    }
}
