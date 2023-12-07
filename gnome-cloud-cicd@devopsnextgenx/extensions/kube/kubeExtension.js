import GObject from 'gi://GObject';
import St from 'gi://St';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export const KubeContainer = GObject.registerClass(
class KubeContainer extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Kube Extension'));

        this.add_child(new St.Icon({
            icon_name: 'face-smile-symbolic',
            style_class: 'system-status-icon',
        }));

        let item = new PopupMenu.PopupMenuItem(_('Show Message'));
        item.connect('activate', () => {
            Main.notify(_('Coming from refactored code!!!'));
        });
        this.menu.addMenuItem(item);
    }
});