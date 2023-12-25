import St from 'gi://St';
import Atk from 'gi://Atk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { getExtensionObject } from "../../extension.js";
import { buildIcon } from '../base/ui-component-store.js';
import { ActionIcon } from '../base/actionIcon.js';
import { createKindCluster, filterTab, jsonToYaml, notify, writeContentToFile } from '../base/systemInterface.js';

const MENU_COLUMNS = 2;
function UUID() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const actionIcon = (clusterName, name = "empty", styleClass = "action-button", action) => {
  const actionIconWidget = new ActionIcon(`${clusterName}-${name}`, `${clusterName}-${name}`);
  let button = new St.Button({ style_class: `form-item-button button` });
  button.child = buildIcon(name, `${styleClass}`);
  actionIconWidget.addChild(button);
  action && button.connect('clicked', action);
  return actionIconWidget;
};

export const KindClusterNode = GObject.registerClass({
    Properties: {
    },
    Signals: { 'menu-set': {} },
}, class KindClusterNode extends St.Widget {
    _init(projectName, containerName, containerStatusMessage) {
        super._init({
          reactive: true,
          can_focus: true,
          track_hover: true,
          style_class: 'node-container',
          accessible_name: containerName,
          accessible_role: Atk.Role.MENU,
          x_expand: true,
          y_expand: true,
          layout_manager: new Clutter.GridLayout({ orientation: Clutter.Orientation.VERTICAL }),
        });
        this.lm = this.layout_manager;
        this.menuRow = 0;
        this.menuCol = 0;
        this.numMenuCols = MENU_COLUMNS;
        this.buildNodeForm();
    }
    buildNodeForm() {
      this.formInput = {};
      const uuid = UUID();
      this.formInput[`${uuid}`]={uuid: uuid};
      this.clusterName = this.buildInput('clusterName', 'Cluster Name', this.formInput[`${uuid}`], 'dev');
      const createClusterFormBind = this.createClusterNodeForm.bind(this, uuid);
      this.addRowItem(
        this.clusterName,
        actionIcon('clusterName','docker-container-symbolic', 'status-paused', createClusterFormBind),
      );
    }
    createClusterNodeForm(uuid) {
      const clusterName = this.formInput[`${uuid}`].clusterName;
      this.addRowItem(this.buildLabel(`Configuration for ${clusterName}`), this.buildIcon('docker-container-symbolic', 'status-running'));
      
      this.workers = this.buildInput('workers', 'Worker Count: 3', this.formInput[`${uuid}`], '1');
      this.apiPort = this.buildInput('apiPort', 'Api Port: 6443', this.formInput[`${uuid}`], '6443');
      this.addRowItem(
        this.workers,
        this.apiPort
      );

      this.hostHttp = this.buildInput('hostHttp', 'cluster http: 80 -> 80', this.formInput[`${uuid}`], '30080');
      this.hostHttps = this.buildInput('hostHttps', 'cluster http: 443 -> 443', this.formInput[`${uuid}`], '30443');
      this.addRowItem(
        this.hostHttp,
        this.hostHttps
      );

      this.podSubnet = this.buildInput('podSubnet', '10.244.0.0/16', this.formInput[`${uuid}`], "10.244.0.0/16");
      this.serviceSubnet = this.buildInput('serviceSubnet', '10.96.0.0/16', this.formInput[`${uuid}`], "10.96.0.0/16");
      this.addRowItem(
        this.podSubnet,
        this.serviceSubnet
      );
      this.label = this.buildLabel(`Create ${clusterName}`);
      const createClusterNodeConfigurationBind = this.createClusterNodeConfiguration.bind(this, uuid);
      this.addRowItem(
        this.label,
        actionIcon('clusterName','docker-container-symbolic', 'status-running', createClusterNodeConfigurationBind),
      );
    }
    async createClusterNodeConfiguration(uuid) {
      const name = filterTab(this.formInput[uuid].clusterName);
      const clusterNode = {
        uuid,
        name,
        workers: filterTab(this.formInput[uuid].workers),
        apiPort: Number(filterTab(this.formInput[uuid].apiPort)),
        hostHttp: Number(filterTab(this.formInput[uuid].hostHttp)),
        hostHttps: Number(filterTab(this.formInput[uuid].hostHttps)),
        podSubnet: filterTab(this.formInput[uuid].podSubnet),
        serviceSubnet: filterTab(this.formInput[uuid].serviceSubnet)
      };
      const clusterConfig = {
        "kind": "Cluster",
        "apiVersion": "kind.x-k8s.io/v1alpha4",
        "networking": {
          "apiServerAddress": "127.0.0.1",
          "apiServerPort": clusterNode.apiPort,
          "podSubnet": clusterNode.podSubnet,
          "serviceSubnet": clusterNode.serviceSubnet
        },
        "nodes": [
          {
            "role": "control-plane",
            "extraPortMappings": [
              {"hostPort": clusterNode.hostHttp, "containerPort": 80},
              {"hostPort": clusterNode.hostHttps, "containerPort": 443}
            ]
          }
        ]
      };
      for (let workerCount = 0; workerCount < clusterNode.workers;workerCount++) {
        clusterConfig.nodes.push({"role": "worker"});
      }
      Main.notify(`Creating kind cluster ${name}.`);
      // Main.notifyError(`Creating kind cluster ${name}.`, `Check log at .local/share/dev-container-manager/${clusterNode.name}.log`);
      const yamlContent = await jsonToYaml(JSON.stringify(clusterConfig));
      await writeContentToFile(yamlContent, `${clusterNode.name}.yaml`, ".local/share/dev-container-manager");
      await writeContentToFile(JSON.stringify(clusterNode), `${clusterNode.name}.json`, ".local/share/dev-container-manager");
      const pOut = await createKindCluster(name);
      
      await writeContentToFile(pOut, `${clusterNode.name}.log`, ".local/share/dev-container-manager");
    }
    buildIcon(iconName) {
      return buildIcon(iconName, 'form-item-icon');
    }
    buildLabel(label) {
      return new St.Label({
        text: label,
        style_class: 'form-item-label',
      })
    }
    buildInput(inputName, hintText, formInput, text) {
      const input = new St.Entry({
        style_class: 'form-item-input',
        name: inputName,
        hint_text: _(hintText),
        track_hover: true,
        can_focus: true,
        text: _(text)
      });
      const inputText = input.clutter_text;
      formInput[`${inputName}`] = text;

      const handleInput = (origin) => {
        const inputValue = `${origin.get_text()}`;
        formInput[`${inputName}`] = inputValue;
      };
      const handleInputBind = handleInput.bind(this);
      inputText.connect('key-release-event', handleInputBind);
      return input;
    }
    addRow(widget, col, colSpan = 1, rowSpan = 1) {
        this.lm.attach(widget, col, this.menuRow, colSpan, rowSpan);
        this.menuCol += colSpan;
        if (this.menuCol >= this.numMenuCols) {
            this.menuRow++;
            this.menuCol = 0;
        }
    }
    addRowItem(labelInput, button) {
      this.addRow(labelInput,0);
      button && this.addRow(button, 1);
    }
});