import St from 'gi://St';
import Atk from 'gi://Atk';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { getExtensionObject } from '../../extension.js';

const MENU_COLUMNS = 2;

export const ActionIcon = GObject.registerClass({
    Properties: {
    },
    Signals: { 'menu-set': {} },
}, class ActionIcon extends St.Widget {
    _init(name, uuid) {
        super._init({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'action-icon',
            accessible_name: name,
            accessible_role: Atk.Role.MENU,
            x_expand: true,
            y_expand: true,

        });
        this.name = name;
        this.uuid = uuid;
        this._delegate = this;
        this._signals = [];

        this.settings = getExtensionObject().getSettings(
            "io.k8s.framework.gnome-cloud-cicd"
        );

        let hbox = new St.BoxLayout();
        this.add_child(hbox);
        this.box = hbox;

        this._minHPadding = this._natHPadding = 0.0;
    }

    addChild(child) {
        if (this.box) {
            this.box.add_child(child);
        } else {
            super.add_child(child);
        }
    }

    destroy() {
        if (this.animationTimer !== 0) {
            GLib.source_remove(this.animationTimer);
            this.animationTimer = 0;
        }
        super.destroy();
    }
});