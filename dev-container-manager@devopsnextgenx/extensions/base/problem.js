'use strict';

import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

export const ProblemReporter = GObject.registerClass(
    class ProblemReporter extends PanelMenu.Button {
        _init(metadata) {
            super._init(0.0, `${metadata.name} Problem Reporter`, false);

            let icon = new St.Icon({
                gicon: new Gio.ThemedIcon({name: 'dialog-error-symbolic'}),
                style_class: 'system-status-icon',
            });
            this.add_child(icon);

            let statusMenu = new PopupMenu.PopupMenuSection();
            let label = new St.Label({
                text: 'Something went wrong while starting dev-container-manager',
                style_class: 'problem-header',
            });
            label.clutter_text.line_wrap = true;
            statusMenu.box.add_child(label);

            this.msg = new St.Label({
                text: '',
                style_class: 'problem-msg',
            });
            this.msg.clutter_text.line_wrap = true;
            statusMenu.box.add_child(this.msg);

            label = new St.Label({
                text: 'Error details',
                style_class: 'problem-details-header',
            });
            statusMenu.box.add_child(label);

            this.details = new St.Label({
                text: '',
                style_class: 'problem-details',
            });
            this.details.clutter_text.line_wrap = true;
            statusMenu.box.add_child(this.details);

            this.menu.addMenuItem(statusMenu);
        }

        setMessage(msg) {
            this.msg.text = msg;
        }

        setDetails(details) {
            this.details.text = details;
        }

        destroy() {
            super.destroy();
        }
});
