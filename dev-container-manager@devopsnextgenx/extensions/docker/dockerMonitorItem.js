"use strict";

import St from 'gi://St';
import Atk from 'gi://Atk';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as System from '../base/systemInterface.js'
import { actionIcon } from '../base/ui-component-store.js';

const _dockerAction = (containerName, dockerCommand) => {
  System.runDockerCommand(dockerCommand, containerName, (ok, command, err) => {
    if (ok) {
      Main.notify("Command `" + command + "` successful");
    } else {
      let errMsg = _("Error occurred when running `" + command + "`");
      Main.notifyError(errMsg);
      logError(errMsg);
      logError(err);
    }
  });
}

/**
 * Get the status of a container from the status message obtained with the docker command
 *
 * @param {String} statusMessage The status message
 *
 * @return {String} The status in ['running', 'paused', 'stopped']
 */
const getStatus = (statusMessage) => {
  let status = "undefined";
  if (statusMessage.indexOf("Exited") > -1) status = "stopped";
  if (statusMessage.indexOf("Up") > -1) status = "running";
  if (statusMessage.indexOf("Paused") > -1) status = "paused";

  return status;
};

// Menu entry representing a Docker container
export const DockerMonitorItem = GObject.registerClass(
  class DockerMonitorItem extends St.Widget {
    _init(projectName, containerName, containerStatusMessage, showInactive) {
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

      let hbox = new St.BoxLayout();
      this.add_child(hbox);
      this.box = hbox;

      const status = getStatus(containerStatusMessage);
      if (showInactive || status === "running") {
        let fnBind = (action) => { return _dockerAction.bind(null, containerName, action) };
        this.addChild(actionIcon(containerName, "docker-container-symbolic", {"class":`status-${status}`}));
        this.addChild(actionIcon(containerName, "docker-container-logs-symbolic", {"class":"status-undefined"}, {fn: fnBind("logs")}));

        switch (status) {
          case "running":
            this.addChild(actionIcon(containerName, "docker-container-exec-symbolic", {"class":"status-exec"}, {fn: fnBind("exec")}));
            this.addChild(actionIcon(containerName, "docker-container-pause-symbolic", {"class":"status-unpause"}, {fn: fnBind("pause")}));
            this.addChild(actionIcon(containerName, "docker-container-restart-symbolic", {"class":"status-paused"}, {fn: fnBind("restart")}));
            this.addChild(actionIcon(containerName, "docker-container-stop-symbolic", {"class":"status-stopped"}, {fn: fnBind("stop")}));
            break;

          case "stopped":
            this.addChild(actionIcon(containerName, "docker-container-start-symbolic", {"class":"status-running"}, {fn: fnBind("start")}));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName, "trash-delete", {"class":"status-stopped"}, {fn: fnBind("rm")}));
            break;

          case "paused":
            this.addChild(actionIcon(containerName, "docker-container-start-symbolic", {"class":"status-running"}, {fn: fnBind("unpause")}));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName, "trash-delete", {"class":"status-stopped"}, {fn: fnBind("rm")}));
            break;

          default:
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            break;
        }

        this.addChild(new St.Label({ text: _(containerName), style_class: `item-label` }));
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
