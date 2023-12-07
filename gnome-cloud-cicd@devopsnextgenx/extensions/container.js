'use strict';

import GObject from 'gi://GObject';
import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

export const GnomeCloudCicdContainer = GObject.registerClass(
    class GnomeCloudCicdContainer extends PanelMenu.Button {
        _init(menuAlignment, nameText, dontCreateMenu) {
            super._init({
                menuAlignment,
                nameText,
                dontCreateMenu,
            });
            this.monitors = [];
            this.box = new St.BoxLayout();
            this.add_child(this.box);
            this.remove_style_class_name('panel-button');
        }

        addMonitor(monitor) {
            this.monitors.push(monitor);
            this.box.add_child(monitor);
        }

        _onDestroy() {
            this.monitors.forEach(monitor => {
                monitor.destroy();
            });
            super._onDestroy();
        }
    }
);
