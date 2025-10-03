"use strict";

import St from 'gi://St';
import Atk from 'gi://Atk';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as System from '../base/systemInterface.js'
import { actionIcon, buildLabel } from '../base/ui-component-store.js';

const _dockerAction = (containerName, dockerCommand, provider) => {
  System.runDockerCommand(provider, dockerCommand, containerName, (ok, command, err) => {
    if (ok) {
      Main.notify("GNOME Extension: dev-container-manager", `Command ${command} successful!!!`);
    } else {
      let errMsg = _(`Error occurred when running ${command}`);
      Main.notifyError(errMsg);
      logError(errMsg);
      logError(err);
    }
  });
}


// Menu entry representing a Docker container
export const DockerMonitorItem = GObject.registerClass(
  class DockerMonitorItem extends St.Widget {
    _init(projectName, containerName, provider, status, showInactive) {
      super._init({
        reactive: true,
        can_focus: true,
        track_hover: true,
        style_class: 'item-container',
        accessible_name: containerName,
        accessible_role: Atk.Role.MENU,
        x_expand: true,
        y_expand: true,

      });
      // console.log(`Creating menu item for ${containerName} with status ${status} using ${provider}`);
      let hbox = new St.BoxLayout();
      this.add_child(hbox);
      this.box = hbox;

      if (showInactive || ["running", "paused"].includes(status)) {
        let fnBind = (action, provider) => { return _dockerAction.bind(null, containerName, action, provider) };
        this.addChild(actionIcon(containerName, "docker-container-symbolic", {"class":`status-${status}`}));
        this.addChild(actionIcon(containerName, "docker-container-logs-symbolic", {"class":"status-undefined"}, {fn: fnBind("logs", `${provider}`), name: "View Logs"}));

        switch (status) {
          case "running":
            this.addChild(actionIcon(containerName, "docker-container-exec-symbolic", {"class":"status-exec"}, {fn: fnBind("exec", `${provider}`), name: "docker exec"}));
            this.addChild(actionIcon(containerName, "docker-container-pause-symbolic", {"class":"status-unpause"}, {fn: fnBind("pause", `${provider}`), name: "Pause Container"}));
            this.addChild(actionIcon(containerName, "docker-container-restart-symbolic", {"class":"status-paused"}, {fn: fnBind("restart", `${provider}`), name: "Restart Container"}));
            this.addChild(actionIcon(containerName, "docker-container-stop-symbolic", {"class":"status-stopped"}, {fn: fnBind("stop", `${provider}`), name: "Stop Container"}));
            break;

          case "stopped":
            this.addChild(actionIcon(containerName, "docker-container-start-symbolic", {"class":"status-running"}, {fn: fnBind("start", `${provider}`), name: "Start Container"}));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName, "trash-delete", {"class":"status-stopped"}, {fn: fnBind("rm", `${provider}`), name: "Remove Container"}));
            break;

          case "paused":
            this.addChild(actionIcon(containerName, "docker-container-start-symbolic", {"class":"status-running"}, {fn: fnBind("unpause", `${provider}`), name: "Unpause Container"}));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName, "trash-delete", {"class":"status-stopped"}, {fn: fnBind("rm", `${provider}`), name: "Remove Container"}));
            break;

          default:
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            break;
        }
        
        this.addChild(actionIcon(containerName, provider, {"class":`status-${status}`}));
        this.addChild(buildLabel(containerName));
      }
    }
    addChild(child) {
      if (this.box) {
        this.box.add_child(child);
      } else {
        super.add_child(child);
      }
    }
  }
);
