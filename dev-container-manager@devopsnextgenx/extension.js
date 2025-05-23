import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { BaseContainer } from './extensions/container.js';
import { DockerMenu } from './extensions/docker/dockerMonitor.js';
import { KindMonitor } from './extensions/kind/kindMonitor.js';
import { Jarvis } from './extensions/jarvis/JarvisMonitor.js';
import { OllamaMonitor } from './extensions/ollama/ollamaMonitor.js';
import { checkDependencies, getMissingDependencies } from './extensions/base/systemInterface.js';

const _this = {}

export const getExtensionObject = () => { return _this['extension'] };

class DevContainerManager {
    constructor(dependencies) {
        this.container = new BaseContainer();
        this.container.addMonitor(new DockerMenu('Docker Containers', 'docker-containers'));
        
        const missingKind = !dependencies.hasKind;
        missingKind && Main.notifyError(`[dev-container-manager] missing dependencies`, 'Install kind in order to create and handle the clusters using docker/podman.');
        !missingKind && this.container.addMonitor(new KindMonitor('Kind Clusters', 'kind-clusters'));
        const missingOllama = !dependencies.hasOllama;
        missingOllama && Main.notifyError(`[dev-container-manager] missing dependencies`, 'Install Ollama and download models to run and monitor local AI models. cmd: "curl -fsSL https://ollama.com/install.sh | sh"');
        this.container.addMonitor(new OllamaMonitor('Ollama', 'Llama'));
        this.container.addMonitor(new Jarvis('Jarvis', 'Jarvis'));
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
        } else {
            this.devContainerManager = new DevContainerManager(dependencies);
            this.devContainerManager.addToPanel();
        }
    }

    disable() {
        _this['extension'] = null;
        this.devContainerManager?.destroy();
        this.devContainerManager = null;
    }
}
