import St from 'gi://St';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';
import { Monitor } from '../base/monitor.js'

import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { buildIcon } from '../base/ui-component-store.js';

const MENU_COLUMNS = 2;

export const Indicator = GObject.registerClass(
    class Indicator extends Monitor {
        _init(name, uuid) {
            super._init(name, uuid);
            this.icon = buildIcon("circle-three")
            this.addChild(this.icon);
            this.addChild(new St.Label({
                text: 'Indicator',
                style_class: 'panel-label',
                y_align: Clutter.ActorAlign.CENTER,
            }));

            this._buildMenu();
        }

        _buildMenu() {
            let label = new St.Label({ text: _('Amogh\'s Machine'), style_class: 'menu-header' });
            this.addMenuRow(label, 0, 2, 1);

            label = new St.Label({ text: _('Amogh is going to write new extension'), style_class: 'menu-label menu-section-end' });
            this.addMenuRow(label, 0, 1, 1);
            this.menuCpuUsage = new St.Label({ text: '0%', style_class: 'menu-value menu-section-end' });
            this.addMenuRow(this.menuCpuUsage, 1, 1, 1);
        }

        destroy() {
            super.destroy();
        }
    });