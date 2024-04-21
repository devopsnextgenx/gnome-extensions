"use strict";

import St from 'gi://St';
import Atk from 'gi://Atk';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { buildIcon } from '../base/ui-component-store.js';
import { ActionIcon } from '../base/actionIcon.js';
import * as System from '../base/systemInterface.js'
import { getExtensionObject } from "../../extension.js";

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

const actionIcon = (containerName, name = "empty", style = {"buttonSize":16, "class":"action-button"}, action) => {
  const actionIconWidget = new ActionIcon(`${containerName}-${name}`, `${containerName}-${name}`);
  let button = new St.Button({ style_class: `${name != 'empty' && action ? 'button' : 'empty-icon'} action-button` });
  button.child = buildIcon(name, `${style.class}`, action ? style.buttonSize : style.buttonSize + 4);
  actionIconWidget.addChild(button);
  action && button.connect('clicked', () => _dockerAction(containerName, action)); // 
  return actionIconWidget;
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

      this.settings = getExtensionObject().getSettings(
        "org.gnome.shell.extensions.dev-container-manager"
      );

      this._buttonSize = this.settings.get_int("button-size");

      let hbox = new St.BoxLayout();
      this.add_child(hbox);
      this.box = hbox;

      const status = getStatus(containerStatusMessage);
      if (showInactive || status === "running") {
        this.addChild(actionIcon(containerName, "docker-container-symbolic", {"buttonSize":this._buttonSize, "class":`status-${status}`}));
        this.addChild(actionIcon(containerName, "docker-container-logs-symbolic", {"buttonSize":this._buttonSize, "class":"status-undefined"}, "logs"));

        switch (status) {
          case "running":
            this.addChild(actionIcon(containerName, "docker-container-exec-symbolic", {"buttonSize":this._buttonSize, "class":"status-exec"}, "exec"));
            this.addChild(actionIcon(containerName, "docker-container-pause-symbolic", {"buttonSize":this._buttonSize, "class":"status-unpause"}, "pause"));
            this.addChild(actionIcon(containerName, "docker-container-restart-symbolic", {"buttonSize":this._buttonSize, "class":"status-paused"}, "restart"));
            this.addChild(actionIcon(containerName, "docker-container-stop-symbolic", {"buttonSize":this._buttonSize, "class":"status-stopped"}, "stop"));
            break;

          case "stopped":
            this.addChild(actionIcon(containerName, "docker-container-start-symbolic", {"buttonSize":this._buttonSize, "class":"status-running"}, "start"));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            break;

          case "paused":
            this.addChild(actionIcon(containerName, "docker-container-start-symbolic", {"buttonSize":this._buttonSize, "class":"status-running"}, "unpause"));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
            this.addChild(actionIcon(containerName));
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
