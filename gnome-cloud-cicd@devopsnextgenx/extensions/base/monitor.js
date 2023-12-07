import St from 'gi://St';
import Atk from 'gi://Atk';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { getExtensionObject } from '../../extension.js';

const MENU_COLUMNS = 2;

export const Monitor = GObject.registerClass({
    Properties: {
    },
    Signals: { 'menu-set': {} },
}, class Monitor extends St.Widget {
    _init(name, uuid) {
        super._init({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'panel-button',
            accessible_name: name,
            accessible_role: Atk.Role.MENU,
            x_expand: true,
            y_expand: true,

        });
        this.name = name;
        this.uuid = uuid;

        this.settings = getExtensionObject().getSettings(
            "io.k8s.framework.gnome-cloud-cicd"
        );

        let hbox = new St.BoxLayout();
        this.add_child(hbox);
        this.box = hbox;

        this._minHPadding = this._natHPadding = 0.0;

        this.setMenu(new PopupMenu.PopupMenu(this, 0.5, St.Side.TOP, 0));
        this.buildMenuBase();
    }

    addChild(child) {
        if (this.box) {
            this.box.add_child(child);
        } else {
            super.add_child(child);
        }
    }

    setMenu(menu) {
        if (this.menu) {
            this.menu.destroy();
        }

        this.menu = menu;
        if (this.menu) {
            this.menu.actor.add_style_class_name('panel-menu');
            this.menu.connect('open-state-changed', this._onOpenStateChanged.bind(this));
            this.menu.actor.connect('key-press-event', this._onMenuKeyPress.bind(this));

            Main.uiGroup.add_actor(this.menu.actor);
            this.menu.actor.hide();
        }
        this.emit('menu-set');
    }

    buildMenuBase() {
        if (!this.menu) {
            return;
        }

        let statusMenu = new PopupMenu.PopupMenuSection();
        let grid = new St.Widget({
            style_class: 'menu-grid',
            layout_manager: new Clutter.GridLayout({ orientation: Clutter.Orientation.VERTICAL }),
        });
        this.lm = grid.layout_manager;
        this.menuRow = 0;
        this.menuCol = 0;
        this.numMenuCols = MENU_COLUMNS;
        statusMenu.box.add_child(grid);
        this.menu.addMenuItem(statusMenu);
    }

    addMenuRow(widget, col, colSpan, rowSpan) {
        this.lm.attach(widget, col, this.menuRow, colSpan, rowSpan);
        this.menuCol += colSpan;
        if (this.menuCol >= this.numMenuCols) {
            this.menuRow++;
            this.menuCol = 0;
        }
    }

    clearMenu() {
        this.menu.removeAll();
        this.buildMenuBase();
    }

    refresh() {
        // Override this in child classes to refresh resource consumption/activity
        console.error('Must override Monitor.refresh()');
    }

    _onMenuKeyPress(actor, event) {
        if (global.focus_manager.navigate_from_event(event)) {
            return Clutter.EVENT_STOP;
        }

        let symbol = event.get_key_symbol();
        if (symbol === Clutter.KEY_Left || symbol === Clutter.KEY_Right) {
            let group = global.focus_manager.get_group(this);
            if (group) {
                let direction = symbol === Clutter.KEY_Left ? St.DirectionType.LEFT : St.DirectionType.RIGHT;
                group.navigate_focus(this, direction, false);
                return Clutter.EVENT_STOP;
            }
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _onOpenStateChanged(menu, open) {
        if (open) {
            this.add_style_pseudo_class('active');
        } else {
            this.remove_style_pseudo_class('active');
        }

        // Setting the max-height won't do any good if the minimum height of the
        // menu is higher then the screen; it's useful if part of the menu is
        // scrollable so the minimum height is smaller than the natural height
        let workArea = Main.layoutManager.getWorkAreaForMonitor(Main.layoutManager.primaryIndex);
        let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let verticalMargins = this.menu.actor.margin_top + this.menu.actor.margin_bottom;

        // The workarea and margin dimensions are in physical pixels, but CSS
        // measures are in logical pixels, so make sure to consider the scale
        // factor when computing max-height
        let maxHeight = Math.round((workArea.height - verticalMargins) / scaleFactor);
        this.menu.actor.style = `max-height: ${maxHeight}px;`;
    }

    _onStyleChanged(actor) {
        let themeNode = actor.get_theme_node();

        this._minHPadding = themeNode.get_length('-minimum-hpadding');
        this._natHPadding = themeNode.get_length('-natural-hpadding');
    }

    vfunc_event(event) {
        if (this.menu &&
            (event.type() === Clutter.EventType.TOUCH_BEGIN ||
                event.type() === Clutter.EventType.BUTTON_PRESS)) {
            this.menu.toggle();
        }

        return Clutter.EVENT_PROPAGATE;
    }

    vfunc_hide() {
        super.vfunc_hide();

        if (this.menu) {
            this.menu.close();
        }
    }

    vfunc_get_preferred_width(_forHeight) {
        let child = this.get_first_child();
        let minimumSize, naturalSize;

        if (child) {
            [minimumSize, naturalSize] = child.get_preferred_width(-1);
        } else {
            minimumSize = naturalSize = 0;
        }

        minimumSize += 2 * this._minHPadding;
        naturalSize += 2 * this._natHPadding;

        return [minimumSize, naturalSize];
    }

    vfunc_get_preferred_height(_forWidth) {
        let child = this.get_first_child();

        if (child) {
            return child.get_preferred_height(-1);
        }

        return [0, 0];
    }

    vfunc_allocate(box) {
        this.set_allocation(box);

        let child = this.get_first_child();
        if (!child) {
            return;
        }

        let [, natWidth] = child.get_preferred_width(-1);

        let availWidth = box.x2 - box.x1;
        let availHeight = box.y2 - box.y1;

        let childBox = new Clutter.ActorBox();
        if (natWidth + 2 * this._natHPadding <= availWidth) {
            childBox.x1 = this._natHPadding;
            childBox.x2 = availWidth - this._natHPadding;
        } else {
            childBox.x1 = this._minHPadding;
            childBox.x2 = availWidth - this._minHPadding;
        }

        childBox.y1 = 0;
        childBox.y2 = availHeight;

        child.allocate(childBox);
    }

    destroy() {
        if (this.animationTimer !== 0) {
            GLib.source_remove(this.animationTimer);
            this.animationTimer = 0;
        }
        super.destroy();
    }
});