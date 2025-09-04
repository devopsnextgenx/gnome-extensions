"use strict";

import St from 'gi://St';
import Atk from 'gi://Atk';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { actionIcon, buildLabel } from '../base/ui-component-store.js';
import * as System from '../base/systemInterface.js'

export const _kindAction = (clusterName, clusterCommand) => {
    System.runKindCommand(clusterCommand, clusterName, (ok, command, err) => {
        if (ok) {
            Main.notify("GNOME Extension: dev-container-manager", `Command ${command} successful!!!`);
        } else {
            let errMsg = _("Error occurred when running `" + command + "`");
            Main.notifyError(errMsg);
            logError(errMsg);
            logError(err);
        }
    });
}

// Menu entry representing a Kind Cluster
export const KindClusterItem = GObject.registerClass(
    class KindClusterItem extends St.Widget {
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

            this.addChild(actionIcon(clusterName, "docker-container-symbolic", { "class":"status-running" }));

            let fnBind = _kindAction.bind(null, clusterName, "delete");
            
            this.addChild(actionIcon(clusterName, "docker-container-stop-symbolic", { "class":"status-stopped" }, {fn: fnBind, name: "Delete Cluster"}));

            this.addChild(buildLabel(clusterName));
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
