"use strict";

import St from 'gi://St';
import Atk from 'gi://Atk';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as System from '../base/systemInterface.js'
import { actionIcon, buildLabel } from '../base/ui-component-store.js';

export const _llamaAction = (modelName, ollamaAction) => {
  System.runOllamaCommand(ollamaAction, modelName, (ok, command, err) => {
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

/**
 * Get the status of a container from the status message obtained with the ollama command
 *
 * @param {String} statusMessage The status message
 *
 * @return {String} The status in ['running', 'paused', 'stopped']
 */
const getStatus = (statusMessage) => {
  let status = "undefined";
  if (statusMessage.indexOf("Down") > -1) status = "stopped";
  if (statusMessage.indexOf("Up") > -1) status = "running";

  return status;
};

// Menu entry representing a Ollama Model
export const OllamaMonitorItem = GObject.registerClass(
  class OllamaMonitorItem extends St.Widget {
    _init(modelName, modelStatus, showInactive) {
      super._init({
        reactive: true,
        can_focus: true,
        track_hover: true,
        style_class: 'item-container',
        accessible_name: modelName,
        accessible_role: Atk.Role.MENU,
        x_expand: true,
        y_expand: true,

      });

      let hbox = new St.BoxLayout();
      this.add_child(hbox);
      this.box = hbox;

      const status = getStatus(modelStatus);
      if (showInactive || status === "running") {
        let fnBind = (action) => { return _llamaAction.bind(null, modelName, action) };
        this.addChild(actionIcon(modelName, status === "running" ? "llama-blue" : "llama", {"class":`status-${status}`}));
        this.addChild(actionIcon(modelName, "docker-container-logs-symbolic", {"class":"status-undefined"}, {fn: fnBind("show")}));

        switch (status) {
          case "running":
            this.addChild(actionIcon(modelName));
            this.addChild(actionIcon(modelName, "llama-stop", {"class":"status-unpause"}, {fn: fnBind("stop")}));
            this.addChild(actionIcon(modelName, "trash-delete", {"class":"status-stopped"}, {fn: fnBind("rm")}));
            break;

          case "stopped":
            this.addChild(actionIcon(modelName, "llama-run", {"class":"status-unpause"}, {fn: fnBind("run")}));
            this.addChild(actionIcon(modelName));
            this.addChild(actionIcon(modelName, "trash-delete", {"class":"status-stopped"}, {fn: fnBind("rm")}));
            break;

          default:
            this.addChild(actionIcon(modelName));
            this.addChild(actionIcon(modelName));
            this.addChild(actionIcon(modelName));
            break;
        }
        
        this.addChild(buildLabel(modelName));
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
