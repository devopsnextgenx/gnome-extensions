"use strict";

import St from 'gi://St';
import Atk from 'gi://Atk';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { buildIcon } from '../base/ui-component-store.js';
import { ActionIcon } from '../base/actionIcon.js';
import * as System from '../base/systemInterface.js'


const _kindAction = (clusterName, clusterCommand) => {
    System.runKindCommand(clusterCommand, clusterName, (ok, command, err) => {
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

const actionIcon = (clusterName, name = "empty", styleClass = "action-button", action) => {
    const actionIconWidget = new ActionIcon(`${clusterName}-${name}`, `${clusterName}-${name}`);
    let button = new St.Button({ style_class: `${name != 'empty' && action ? 'button' : 'empty-icon'} action-button` });
    button.child = buildIcon(name, `${styleClass}`, action ? "16" : "20");
    actionIconWidget.addChild(button);
    action && button.connect('clicked', () => _kindAction(clusterName, action)); // 
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

// Menu entry representing a Kind Cluster
export const KindMonitorItem = GObject.registerClass(
    class KindMonitorItem extends St.Widget {
        _init(clusterName) {
            super._init({
                reactive: true,
                can_focus: true,
                track_hover: true,
                style_class: 'item-container',
                accessible_name: clusterName,
                accessible_role: Atk.Role.MENU,
                x_expand: true,
                y_expand: true,

            });
            let hbox = new St.BoxLayout();
            this.add_child(hbox);
            this.box = hbox;

            this.addChild(actionIcon(clusterName, "docker-container-symbolic", "status-running"));

            this.addChild(actionIcon(clusterName, "docker-container-stop-symbolic", "status-stopped", "delete"));

            this.addChild(new St.Label({ text: _(clusterName), style_class: `item-label` }));

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
