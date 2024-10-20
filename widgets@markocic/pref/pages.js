/* exported BatteryBarPage DashBoardPage DateMenuTweakPage
            DynamicPanelPage MediaPlayerPage PowerMenuPage StylishOSDPage
            WorkspaceIndicatorPage NotificationIndicatorPage
            BackgroundClockPage QuickSettingsTweaksPage */

export { BatteryBarPage, DashBoardPage, DateMenuTweakPage,
            DynamicPanelPage, MediaPlayerPage, PowerMenuPage, StylishOSDPage,
            WorkspaceIndicatorPage, NotificationIndicatorPage,
            BackgroundClockPage, QuickSettingsTweaksPage };

// const {Adw, Gio, Gtk, GObject, GLib} = imports.gi;
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';

// const Me = imports.misc.extensionUtils.getCurrentExtension();
// import SpinButtonRow from './widgets.js';
// import EntryRow from './widgets.js';
// import DropDownRow from './widgets.js';
// import SwitchRow from './widgets.js';
// import ColorRow from './widgets.js';
// import ExpanderRow from './widgets.js';
// import PositionRow from './widgets.js';
// import FileChooserButton from './widgets.js';
// import HotkeyDialog from './widgets.js';
import {
    SpinButtonRow, EntryRow, DropDownRow,
    SwitchRow, ColorRow, ExpanderRow,
    PositionRow, FileChooserButton, HotkeyDialog
} from './widgets.js';

// const {wsNamesGroup} = Me.imports.pref.workspaces;
import { wsNamesGroup } from './workspaces.js';

// import { gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
// import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
// const _ = imports.gettext.domain(Me.metadata.uuid).gettext;

const MEDIA_CACHE = `${GLib.get_user_cache_dir()}/aylur/media`;
const MEDIA_SUBTITLE = "Doesn't work with every media player";
const MEDIA_SUBTITLE2 = "Doesn't work on every style";
const MEDIA_SUBTITLE_FADE = 'Fading behind controls buttons and title.';

const SubPage = GObject.registerClass(
class SubPage extends Gtk.Box {
    _init(title, settings) {
        super._init({
            orientation: Gtk.Orientation.VERTICAL,
        });
        this.settings = settings;
        this.title = title;

        this.headerBar = new Adw.HeaderBar({
            title_widget: new Adw.WindowTitle({
                title,
            }),
            decoration_layout: '',
        });
        this.append(this.headerBar);
        const backButton = new Gtk.Button({
            icon_name: 'go-previous-symbolic',
            tooltip_text: 'Back',
            css_classes: ['flat'],
        });
        backButton.connect('clicked', () => {
            const window = this.get_root();
            window.close_subpage();
        });
        this.headerBar.pack_start(backButton);

        this.page = new Adw.PreferencesPage();
        this.append(this.page);
    }

    add(widget) {
        this.page.add(widget);
    }
});

var BatteryBarPage = GObject.registerClass(
class BatteryBarPage extends SubPage {
    _init(settings) {
        super._init('Battery Bar', settings);

        const group = new Adw.PreferencesGroup({title: 'Battery Bar'});
        this.add(group);

        group.add(new PositionRow('Position', settings, 'battery-bar-position', 'battery-bar-offset'));

        const iconExpanderRow = new ExpanderRow('Show Icon', settings, 'battery-bar-show-icon');
        iconExpanderRow.add_row(new DropDownRow('Icon Position', settings, 'battery-bar-icon-position', ['Left', 'Right']));

        const labelExpanderRow = new ExpanderRow('Show Percentage', settings, 'battery-bar-show-percentage');
        labelExpanderRow.add_row(new ColorRow('Font Color Front', settings, 'battery-bar-font-color'));
        labelExpanderRow.add_row(new ColorRow('Font Color Background', settings, 'battery-bar-font-bg-color'));

        group.add(iconExpanderRow);
        group.add(labelExpanderRow);
        group.add(new SpinButtonRow('Width', settings, 'battery-bar-width', 50, 800, 10));
        group.add(new SpinButtonRow('Height', settings, 'battery-bar-height', 1, 100, 1));
        group.add(new SpinButtonRow('Bar Roundness', settings, 'battery-bar-roundness', 0, 50, 1));
        group.add(new SpinButtonRow('Low Threshold', settings, 'battery-bar-low-threshold', 0, 100, 5));
        group.add(new SpinButtonRow('Padding Right', settings, 'battery-bar-padding-right', 0, 100, 1));
        group.add(new SpinButtonRow('Padding Left', settings, 'battery-bar-padding-left', 0, 100, 1));

        const colorExpander = new Adw.ExpanderRow({title: 'Bar Colors'});
        colorExpander.add_row(new ColorRow('Color', settings, 'battery-bar-color'));
        colorExpander.add_row(new ColorRow('Charging Color', settings, 'battery-bar-charging-color'));
        colorExpander.add_row(new ColorRow('Low Color', settings, 'battery-bar-low-color'));
        colorExpander.add_row(new ColorRow('Background Color', settings, 'battery-bar-bg-color'));
        group.add(colorExpander);
    }
});

var DashBoardPage = GObject.registerClass(
class DashBoardPage extends SubPage {
    _init(settings) {
        super._init('Dash Board', settings);

        const buttonGroup = new Adw.PreferencesGroup({title: 'Panel Button'});
        this.add(buttonGroup);

        buttonGroup.add(new SwitchRow('Hide Activities Button', settings, 'dash-hide-activities'));
        const enableExpander = new ExpanderRow('Enable Panel Button', settings, 'dash-button-enable');
        enableExpander.add_row(new PositionRow('Position', settings, 'dash-button-position', 'dash-button-offset'));
        const showIcon = new SwitchRow('Show Icon', settings, 'dash-button-show-icon');
        showIcon.add_suffix(new FileChooserButton(settings, 'dash-button-icon-path'));
        enableExpander.add_row(showIcon);
        enableExpander.add_row(new EntryRow('Label', settings, 'dash-button-label'));
        buttonGroup.add(enableExpander);

        const dashGroup = new Adw.PreferencesGroup({title: 'Dash'});
        this.add(dashGroup);

        const shortcutRow = new Adw.ActionRow({title: 'Shortcut Hotkey'});
        const shortcutCell = new Gtk.ShortcutsShortcut({valign: Gtk.Align.CENTER});
        shortcutCell.accelerator = settings.get_strv('dash-shortcut').toString();
        const hotkeyButton = new Gtk.Button({
            label: 'Set Hotkey',
            valign: Gtk.Align.CENTER,
        });
        hotkeyButton.connect('clicked', () => {
            const dialog = new HotkeyDialog(settings, this);
            dialog.show();
            dialog.connect('response', (_w, response) => {
                if (response === Gtk.ResponseType.APPLY) {
                    settings.set_strv('dash-shortcut', [dialog.resultsText]);
                    shortcutCell.accelerator = dialog.resultsText;
                }
                dialog.destroy();
            });
        });
        shortcutRow.add_suffix(shortcutCell);
        shortcutRow.add_suffix(hotkeyButton);

        const readConfigRow = new Adw.ActionRow({title: 'Read Config', subtitle: '~/.local/share/gnome-shell/extensions/widgets@aylur/config/dashboard.json'});
        const readConfigBtn = new Gtk.Button({
            label: 'Apply',
            valign: Gtk.Align.CENTER,
        });
        readConfigBtn.connect('clicked', () => {
            settings.set_int('dash-read-config', settings.get_int('dash-read-config') + 1);
        });
        readConfigRow.add_suffix(readConfigBtn);

        dashGroup.add(readConfigRow);
        dashGroup.add(shortcutRow);
        dashGroup.add(new DropDownRow('X Align', settings, 'dash-board-x-align', ['Fill', 'Start', 'Center', 'End']));
        dashGroup.add(new DropDownRow('Y Align', settings, 'dash-board-y-align', ['Fill', 'Start', 'Center', 'End']));
        dashGroup.add(new SpinButtonRow('X Offset', settings, 'dash-board-x-offset', -1000, 1000, 10));
        dashGroup.add(new SpinButtonRow('Y Offset', settings, 'dash-board-y-offset', -1000, 1000, 10));
        dashGroup.add(new SwitchRow('Darken Background', settings, 'dash-board-darken'));

        const widgetsGroup = new Adw.PreferencesGroup({title: 'Widgets'});
        this.add(widgetsGroup);

        const user = this._makeExpander('User', 'user', settings);
        user.add_row(new SpinButtonRow('Icon Roundness', settings, 'dash-user-icon-roundness', 0, 99, 1));
        user.add_row(new SpinButtonRow('Icon Width', settings, 'dash-user-icon-width', 10, 500, 2));
        user.add_row(new SpinButtonRow('Icon Height', settings, 'dash-user-icon-height', 10, 500, 2));
        user.add_row(new SwitchRow('Vertical', settings, 'dash-user-vertical'));
        user.add_row(new SwitchRow('Show Real Name', settings, 'dash-user-real-name'));

        const levels = this._makeExpander('System Levels', 'levels', settings);
        levels.add_row(new SwitchRow('Vertical', settings, 'dash-levels-vertical'));
        levels.add_row(new SwitchRow('Show Battery', settings, 'dash-levels-show-battery'));
        levels.add_row(new SwitchRow('Show Storage', settings, 'dash-levels-show-storage'));
        levels.add_row(new SwitchRow('Show CPU', settings, 'dash-levels-show-cpu'));
        levels.add_row(new SwitchRow('Show RAM', settings, 'dash-levels-show-ram'));
        levels.add_row(new SwitchRow('Show Temperature', settings, 'dash-levels-show-temp'));

        const media = this._makeExpander('Media Player', 'media', settings);
        media.add_row(new EntryRow('Prefer', settings, 'dash-media-prefer'));
        media.add_row(new DropDownRow('Style', settings, 'dash-media-style', ['Normal Vertical', 'Normal Horizontal', 'Label on Cover', 'Label on Cover +Vertical Controls', 'Full']));
        media.add_row(new SpinButtonRow('Cover Width', settings, 'dash-media-cover-width', 100, 800, 5));
        media.add_row(new SpinButtonRow('Cover Height', settings, 'dash-media-cover-height', 100, 800, 5));
        media.add_row(new SpinButtonRow('Cover Roundness', settings, 'dash-media-cover-roundness', 0, 48, 1));
        media.add_row(new SwitchRow('Fade', settings, 'dash-media-fade', MEDIA_SUBTITLE_FADE));
        const textExpander = new ExpanderRow('Show Title', settings, 'date-menu-media-show-text');
        textExpander.add_row(new DropDownRow('Title Align', settings, 'date-menu-media-text-align', ['Left', 'Center', 'Right']));
        textExpander.add_row(new DropDownRow('Title Position', settings, 'date-menu-media-text-position', ['Top', 'Bot'], MEDIA_SUBTITLE2));
        media.add_row(textExpander);
        media.add_row(new SwitchRow('Show Volume Slider', settings, 'dash-media-show-volume', MEDIA_SUBTITLE));
        media.add_row(new SwitchRow('Show Loop and Shuffle', settings, 'dash-media-show-loop-shuffle', MEDIA_SUBTITLE));

        const links = this._makeExpander('Links', 'links', settings);
        links.add_row(new SwitchRow('Vertical', settings, 'dash-links-vertical'));
        links.add_row(new SpinButtonRow('Icon Size', settings, 'dash-links-icon-size', 4, 100, 2));
        links.add_row(new Adw.ActionRow({
            title: 'Web Links',
            subtitle: 'You can change the links through dconf editor.\nIf you want your own icon: find an svg and name it theNameYouGaveItInDconf-symbolic.svg.',
        }));

        const clock = this._makeExpander('Clock', 'clock', settings);
        clock.add_row(new SwitchRow('Vertical', settings, 'dash-clock-vertical'));

        const apps = this._makeExpander('App Launcher', 'apps', settings);
        apps.add_row(new SpinButtonRow('Rows', settings, 'dash-apps-rows', 1, 6, 1));
        apps.add_row(new SpinButtonRow('Columns', settings, 'dash-apps-cols', 1, 6, 1));
        apps.add_row(new SpinButtonRow('Icon Size', settings, 'dash-apps-icon-size', 4, 100, 2));

        const setting = this._makeExpander('Settings', 'settings', settings);
        setting.add_row(new SwitchRow('Vertical', settings, 'dash-settings-vertical'));
        setting.add_row(new SpinButtonRow('Icon Size', settings, 'dash-settings-icon-size', 4, 100, 2));

        const system = this._makeExpander('System Actions', 'system', settings);
        system.add_row(new DropDownRow('Layout', settings, 'dash-system-layout', ['Vertical', 'Horizontal', '2x2']));
        system.add_row(new SpinButtonRow('Icon Size', settings, 'dash-system-icon-size', 4, 100, 2));

        widgetsGroup.add(apps);
        widgetsGroup.add(clock);
        widgetsGroup.add(levels);
        widgetsGroup.add(links);
        widgetsGroup.add(media);
        widgetsGroup.add(setting);
        widgetsGroup.add(system);
        widgetsGroup.add(user);
    }

    _makeExpander(title, widget, settings) {
        const expander = new Adw.ExpanderRow({title});
        expander.add_row(new DropDownRow('X Axis Align', settings, `dash-${widget}-x-align`, ['Fill', 'Start', 'Center', 'End']));
        expander.add_row(new DropDownRow('Y Axis Align', settings, `dash-${widget}-y-align`, ['Fill', 'Start', 'Center', 'End']));
        expander.add_row(new SwitchRow('X Axis Expand', settings, `dash-${widget}-x-expand`));
        expander.add_row(new SwitchRow('Y Axis Expand', settings, `dash-${widget}-y-expand`));
        expander.add_row(new SpinButtonRow('Width', settings, `dash-${widget}-width`, 0, 500, 5, '0 for dynamic width'));
        expander.add_row(new SpinButtonRow('Height', settings, `dash-${widget}-height`, 0, 500, 5, '0 for dynamic width'));
        expander.add_row(new SwitchRow('Background', settings, `dash-${widget}-background`));
        return expander;
    }
});

var DateMenuTweakPage = GObject.registerClass(
class DateMenuTweakPage extends SubPage {
    _init(settings) {
        super._init('Date Menu Tweaks', settings);

        const menuGroup = new Adw.PreferencesGroup({title: 'Date Menu Tweaks'});
        this.add(menuGroup);
        menuGroup.add(new SwitchRow('Mirrored', settings, 'date-menu-mirror'));
        menuGroup.add(new SwitchRow('Hide Notifications', settings, 'date-menu-hide-notifications'));
        menuGroup.add(new SwitchRow('Hide Stock Mpris', settings, 'date-menu-hide-stock-mpris', 'Hides the media players in the notification list'));

        const customMenuGroup = new Adw.PreferencesGroup({title: 'Custom Menu'});
        this.add(customMenuGroup);

        const expander = new ExpanderRow('Enable Custom Menu', settings, 'date-menu-custom-menu');
        const userExpander = new ExpanderRow('Show User Icon', settings, 'date-menu-show-user');
        userExpander.add_row(new SwitchRow('Show Real Name', settings, 'date-menu-user-real-name'));
        expander.add_row(userExpander);
        expander.add_row(new SwitchRow('Show Events', settings, 'date-menu-show-events'));
        expander.add_row(new SwitchRow('Show Clocks', settings, 'date-menu-show-clocks'));
        expander.add_row(new SwitchRow('Show Weather', settings, 'date-menu-show-weather'));

        const levelsExpander = new ExpanderRow('Show System Levels', settings, 'date-menu-show-system-levels');
        levelsExpander.add_row(new SwitchRow('Battery', settings, 'date-menu-levels-show-battery'));
        levelsExpander.add_row(new SwitchRow('Storage', settings, 'date-menu-levels-show-storage'));
        levelsExpander.add_row(new SwitchRow('CPU', settings, 'date-menu-levels-show-cpu'));
        levelsExpander.add_row(new SwitchRow('RAM', settings, 'date-menu-levels-show-ram'));
        levelsExpander.add_row(new SwitchRow('Temperature', settings, 'date-menu-levels-show-temp'));
        expander.add_row(levelsExpander);

        const mediaExpander = new ExpanderRow('Show Media Player', settings, 'date-menu-show-media');
        mediaExpander.add_row(new EntryRow('Prefer', settings, 'date-menu-media-prefer'));
        mediaExpander.add_row(new DropDownRow('Style', settings, 'date-menu-media-style', ['Normal', 'Label on Cover', 'Label on Cover +Vertical Controls', 'Full']));
        mediaExpander.add_row(new SpinButtonRow('Cover Width', settings, 'date-menu-media-cover-width', 100, 500, 5));
        mediaExpander.add_row(new SpinButtonRow('Cover Height', settings, 'date-menu-media-cover-height', 100, 500, 5));
        mediaExpander.add_row(new SpinButtonRow('Cover Roundness', settings, 'date-menu-media-cover-roundness', 0, 48, 1));
        mediaExpander.add_row(new SwitchRow('Fade', settings, 'date-menu-media-fade', MEDIA_SUBTITLE_FADE));
        const textExpander = new ExpanderRow('Show Title', settings, 'date-menu-media-show-text');
        textExpander.add_row(new DropDownRow('Title Align', settings, 'date-menu-media-text-align', ['Left', 'Center', 'Right']));
        textExpander.add_row(new DropDownRow('Title Position', settings, 'date-menu-media-text-position', ['Top', 'Bot'], MEDIA_SUBTITLE2));
        mediaExpander.add_row(textExpander);
        mediaExpander.add_row(new SwitchRow('Show Volume Slider', settings, 'date-menu-media-show-volume', MEDIA_SUBTITLE));
        mediaExpander.add_row(new SwitchRow('Show Loop and Shuffle', settings, 'date-menu-media-show-loop-shuffle', MEDIA_SUBTITLE));
        expander.add_row(mediaExpander);

        customMenuGroup.add(expander);

        const buttonGroup = new Adw.PreferencesGroup({title: 'Clock Button'});
        this.add(buttonGroup);
        buttonGroup.add(new PositionRow('Position', settings, 'date-menu-position', 'date-menu-offset'));
        buttonGroup.add(new SwitchRow('Remove Padding', settings, 'date-menu-remove-padding'));
        buttonGroup.add(new DropDownRow('Indicator Position', settings, 'date-menu-indicator-position', ['Left', 'Right', 'Hide']));
        buttonGroup.add(new EntryRow('Format', settings, 'date-menu-date-format'));
        const textBox = new Gtk.Box();
        textBox.append(new Gtk.Label({
            xalign: 0,
            label: `
            %M - minutes 00-59
            %H - hour 00-23
            %I - hour 01-12
            %k - hour 0-23
            %l - hour 1-12
            %p - AM PM
            %P - am pm

            %C - century 00-99
            %j - day of year 001-366`,
        }));
        textBox.append(new Gtk.Label({
            xalign: 0,
            label: `
            %a - weekday abr
            %A - weekday name
            %b - monthname abr
            %B - monthname name
            %Y - year 2000
            %d - day 01-31
            %e - day 1-31
            %m - month 01-12`,
        }));
        buttonGroup.add(textBox);
    }
});

var DynamicPanelPage = GObject.registerClass(
class DynamicPanelPage extends SubPage {
    _init(settings) {
        super._init('Dynamic Panel', settings);

        const group = new Adw.PreferencesGroup();
        this.add(group);

        group.add(new SwitchRow('Floating', settings, 'dynamic-panel-floating-style', 'Best used with default shell themes'));
        group.add(new SpinButtonRow('Gap', settings, 'dynamic-panel-useless-gaps', 0, 64, 1, 'Space beetween panel and window needed to make the panel react'));
    }
});

var MediaPlayerPage = GObject.registerClass(
class MediaPlayerPage extends SubPage {
    _init(settings) {
        super._init('Media Player', settings);

        const buttonGroup = new Adw.PreferencesGroup({title: 'Panel Button'});
        this.add(buttonGroup);

        const trackBtnExpander = new ExpanderRow('Track Button', settings, 'media-player-enable-track');
        trackBtnExpander.add_row(new PositionRow('Position', settings, 'media-player-position', 'media-player-offset'));
        trackBtnExpander.add_row(new SpinButtonRow('Max Width', settings, 'media-player-max-width', 0, 1200, 10, '0 to unset'));
        trackBtnExpander.add_row(new SwitchRow('Show Player Icon', settings, 'media-player-show-player-icon'));
        trackBtnExpander.add_row(new SwitchRow('Colored Player Icon', settings, 'media-player-colored-player-icon'));
        trackBtnExpander.add_row(new DropDownRow('Player Icon Position', settings, 'media-player-player-icon-position', ['Left', 'Right']));

        const controlsExpander = new ExpanderRow('Controls', settings, 'media-player-enable-controls');
        controlsExpander.add_row(new PositionRow('Position', settings, 'media-player-controls-position', 'media-player-controls-offset'));
        buttonGroup.add(trackBtnExpander);
        buttonGroup.add(controlsExpander);

        const playerGroup = new Adw.PreferencesGroup({title: 'Player'});
        this.add(playerGroup);

        this.clearRow = new Adw.ActionRow({title: 'Cache'});
        const clearBtn = Gtk.Button.new_with_label('Clear');
        clearBtn.valign = Gtk.Align.CENTER;
        clearBtn.connect('clicked', () => this._clearCache());
        this.clearRow.add_suffix(clearBtn);
        playerGroup.add(this.clearRow);
        this._cacheSize();

        playerGroup.add(new EntryRow('Prefer', settings, 'media-player-prefer', 'It is the players d-bus name. e.g: Amberol, firefox, spotify.'));
        playerGroup.add(new DropDownRow('Style', settings, 'media-player-style', ['Normal', 'Horizontal', 'Compact', 'Label on Cover', 'Label on Cover +Vertical Controls', 'Full']));
        playerGroup.add(new SpinButtonRow('Cover Roundness', settings, 'media-player-cover-roundness', 1, 99, 1));
        playerGroup.add(new SpinButtonRow('Cover Width', settings, 'media-player-cover-width', 50, 500, 2));
        playerGroup.add(new SpinButtonRow('Cover Height', settings, 'media-player-cover-height', 50, 500, 2));
        playerGroup.add(new SwitchRow('Fade', settings, 'media-player-fade', MEDIA_SUBTITLE_FADE));
        const textExpander = new ExpanderRow('Show Title', settings, 'media-player-show-text');
        textExpander.add_row(new DropDownRow('Title Align', settings, 'media-player-text-align', ['Left', 'Center', 'Right']));
        textExpander.add_row(new DropDownRow('Title Position', settings, 'media-player-text-position', ['Top', 'Bot'], MEDIA_SUBTITLE2));
        playerGroup.add(textExpander);
        playerGroup.add(new SwitchRow('Show Volume Slider', settings, 'media-player-show-volume', MEDIA_SUBTITLE));
        playerGroup.add(new SwitchRow('Show Loop and Shuffle', settings, 'media-player-show-loop-shuffle', MEDIA_SUBTITLE));
    }

    _cacheSize() {
        const dir = Gio.File.new_for_path(MEDIA_CACHE);
        if (!GLib.file_test(MEDIA_CACHE, GLib.FileTest.EXISTS))
            dir.make_directory_with_parents(null);

        const info = dir.query_info('standard::*', Gio.FileQueryInfoFlags.NONE, null);
        this.clearRow.set_subtitle(`${info.get_size()} bytes`);
    }

    _clearCache() {
        const dir = Gio.File.new_for_path(MEDIA_CACHE);
        dir.trash(null);
        dir.make_directory_with_parents(null);
        this.clearRow.set_subtitle('Cleared!');
    }
});

var PowerMenuPage = GObject.registerClass(
class PowerMenuPage extends SubPage {
    _init(settings) {
        super._init('Power Menu', settings);

        const group = new Adw.PreferencesGroup({title: 'Power Menu'});
        this.add(group);

        group.add(new PositionRow('Position', settings, 'power-menu-position', 'power-menu-offset'));
        group.add(new DropDownRow('Layout', settings, 'power-menu-layout', ['2x2', '1x4']));
        group.add(new DropDownRow('Label Position', settings, 'power-menu-label-position', ['Inside', 'Outside', 'Hidden']));
        group.add(new SpinButtonRow('Button Roundness', settings, 'power-menu-button-roundness', 0, 99, 2));
        group.add(new SpinButtonRow('Icon Size', settings, 'power-menu-icon-size', 0, 300, 2));
        group.add(new SpinButtonRow('Icon Padding', settings, 'power-menu-icon-padding', 0, 150, 2));
        group.add(new SpinButtonRow('Spacing', settings, 'power-menu-dialog-spacing', 0, 150, 2));

        const dialogExpander = new ExpanderRow('Dialog Background', settings, 'power-menu-dialog-show-bg');
        dialogExpander.add_row(new SpinButtonRow('Dialog Padding', settings, 'power-menu-dialog-padding', 0, 150, 2));
        dialogExpander.add_row(new SpinButtonRow('Dialog Roundness', settings, 'power-menu-dialog-roundness', -100, 100, 1));

        group.add(dialogExpander);
    }
});

var StylishOSDPage = GObject.registerClass(
class StylishOSDPage extends SubPage {
    _init(settings) {
        super._init('Stylish On Screen Display', settings);

        const group = new Adw.PreferencesGroup({title: 'OSD', description: 'The popup when brightness/volume is changed'});
        this.add(group);

        group.add(new DropDownRow('Position', settings, 'stylish-osd-position', ['Top Start', 'Top Center', 'Top End', 'Middle Start', 'Middle Center', 'Middle End', 'Bottom Start', 'Bottom Center', 'Bottom End']));
        group.add(new SwitchRow('Vertical', settings, 'stylish-osd-vertical'));
        group.add(new SpinButtonRow('Width', settings, 'stylish-osd-width', 4, 500, 2));
        group.add(new SpinButtonRow('Height', settings, 'stylish-osd-height', 4, 500, 2));
        group.add(new SpinButtonRow('Horizontal Offset', settings, 'stylish-osd-margin-x', 0, 500, 2));
        group.add(new SpinButtonRow('Vertical Offset', settings, 'stylish-osd-margin-y', 0, 500, 2));
        group.add(new SpinButtonRow('Roundness', settings, 'stylish-osd-roundness', 0, 250, 1));
        group.add(new SpinButtonRow('Padding', settings, 'stylish-osd-padding', 0, 100, 1));
        group.add(new SpinButtonRow('Icon Size', settings, 'stylish-osd-icon-size', 1, 250, 1));
    }
});

var WorkspaceIndicatorPage = GObject.registerClass(
class WorkspaceIndicatorPage extends SubPage {
    _init(settings) {
        super._init('Workspace Indicator', settings);

        const group = new Adw.PreferencesGroup({title: 'Panel Widget'});
        this.add(group);

        group.add(new PositionRow('Position', settings, 'workspace-indicator-position', 'workspace-indicator-offset'));
        group.add(new SwitchRow('Show Names', settings, 'workspace-indicator-show-names'));
        group.add(new DropDownRow('Style', settings, 'workspace-indicator-style', ['Joined', 'Seperated']));
        group.add(new SpinButtonRow('Spacing', settings, 'workspace-indicator-spacing', 0, 100, 1));
        group.add(new EntryRow('Active Name', settings, 'workspace-indicator-active-name', 'Empty to disable'));

        this.add(new wsNamesGroup());
    }
});

var NotificationIndicatorPage = GObject.registerClass(
class NotificationIndicatorPage extends SubPage {
    _init(settings) {
        super._init('Notification Indicator', settings);

        const buttonGroup = new Adw.PreferencesGroup({title: 'Panel Button'});
        this.add(buttonGroup);
        buttonGroup.add(new DropDownRow('Position', settings, 'notification-indicator-position', ['Left', 'Center', 'Right', ('System Indicators')]));
        buttonGroup.add(new SpinButtonRow('Offset', settings, 'notification-indicator-offset', 0, 16, 1));
        buttonGroup.add(new DropDownRow('Style', settings, 'notification-indicator-style', ['Counter', 'Icons']));

        const menuGroup = new Adw.PreferencesGroup({title: 'Menu', description: 'Does not work if the position is set to System Indicators'});
        this.add(menuGroup);
        menuGroup.add(new SpinButtonRow('Menu Width', settings, 'notification-indicator-menu-width', 100, 1000, 10));
        menuGroup.add(new SwitchRow('Show Do Not Disturb', settings, 'notification-indicator-show-dnd'));

        const iconsGroup = new Adw.PreferencesGroup({title: 'Icons'});
        this.add(iconsGroup);
        iconsGroup.add(new SpinButtonRow('Max Icons', settings, 'notification-indicator-max-icons', 1, 20, 1));

        const counterGroup = new Adw.PreferencesGroup({title: 'Counter'});
        this.add(counterGroup);
        counterGroup.add(new SwitchRow('Hide on Zero', settings, 'notification-indicator-hide-on-zero'));
        counterGroup.add(new SwitchRow('Hide Counter', settings, 'notification-indicator-hide-counter'));
    }
});

var BackgroundClockPage = GObject.registerClass(
class BackgroundClockPage extends SubPage {
    _init(settings) {
        super._init('Background Clock', settings);

        const group = new Adw.PreferencesGroup({title: 'Background Clock'});
        this.add(group);

        group.add(new DropDownRow('Position', settings, 'background-clock-position',
            ['Top Left', 'Top Center', 'Top Right',
                'Middle Left', 'Middle Center', 'Middle Right',
                'Bottom Left', 'Bottom Center', 'Bottom Right']));

        group.add(new SpinButtonRow('X Offset', settings, 'background-clock-x-offset', 0, 500, 5));
        group.add(new SpinButtonRow('Y Offset', settings, 'background-clock-y-offset', 0, 500, 5));

        const clockExpander = new ExpanderRow('Clock', settings, 'background-clock-enable-clock');
        clockExpander.add_row(new EntryRow('Clock Format', settings, 'background-clock-clock-format'));
        clockExpander.add_row(new SpinButtonRow('Clock Size', settings, 'background-clock-clock-size', 1, 200, 2));
        clockExpander.add_row(this._addCustomFontRow(settings, 'background-clock-clock-custom-font', 'background-clock-clock-font'));
        clockExpander.add_row(new ColorRow('Clock Color', settings, 'background-clock-clock-color'));
        clockExpander.add_row(new SpinButtonRow('Text Shadow x Offset', settings, 'background-clock-clock-shadow-x', -50, 50, 1));
        clockExpander.add_row(new SpinButtonRow('Text Shadow y Offset', settings, 'background-clock-clock-shadow-y', -50, 50, 1));
        clockExpander.add_row(new SpinButtonRow('Text Shadow Blur Amount', settings, 'background-clock-clock-shadow-blur', 0, 50, 1));
        clockExpander.add_row(new SpinButtonRow('Text Shadow Width', settings, 'background-clock-clock-shadow-width', -50, 50, 1));
        clockExpander.add_row(new ColorRow('Text Shadow Color', settings, 'background-clock-clock-shadow-color'));

        const dateExpander = new ExpanderRow('Date', settings, 'background-clock-enable-date');
        dateExpander.add_row(new EntryRow('Date Format', settings, 'background-clock-date-format'));
        dateExpander.add_row(new SpinButtonRow('Date Size', settings, 'background-clock-date-size', 1, 200, 2));
        dateExpander.add_row(this._addCustomFontRow(settings, 'background-clock-date-custom-font', 'background-clock-date-font'));
        dateExpander.add_row(new ColorRow('Date Color', settings, 'background-clock-date-color'));
        dateExpander.add_row(new SpinButtonRow('Text Shadow x Offset', settings, 'background-clock-date-shadow-x', -50, 50, 1));
        dateExpander.add_row(new SpinButtonRow('Text Shadow y Offset', settings, 'background-clock-date-shadow-y', -50, 50, 1));
        dateExpander.add_row(new SpinButtonRow('Text Shadow Blur Amount', settings, 'background-clock-date-shadow-blur', 0, 50, 1));
        dateExpander.add_row(new SpinButtonRow('Text Shadow Width', settings, 'background-clock-date-shadow-width', -50, 50, 1));
        dateExpander.add_row(new ColorRow('Text Shadow Color', settings, 'background-clock-date-shadow-color'));

        const styleExpander = new Adw.ExpanderRow({title: 'Widget Style'});
        styleExpander.add_row(new ColorRow('Background Color', settings, 'background-clock-bg-color'));
        styleExpander.add_row(new SpinButtonRow('Padding', settings, 'background-clock-bg-padding', 0, 100, 1));
        styleExpander.add_row(new SpinButtonRow('Border Size', settings, 'background-clock-bg-border-size', 0, 100, 1));
        styleExpander.add_row(new ColorRow('Border Color', settings, 'background-clock-bg-border-color'));
        styleExpander.add_row(new SpinButtonRow('Roundness', settings, 'background-clock-bg-border-radius', 0, 100, 1));
        styleExpander.add_row(new SwitchRow('Shadow Inset', settings, 'background-clock-bg-shadow-inset'));
        styleExpander.add_row(new SpinButtonRow('Shadow x Offset', settings, 'background-clock-bg-shadow-x', -100, 100, 1));
        styleExpander.add_row(new SpinButtonRow('Shadow y Offset', settings, 'background-clock-bg-shadow-y', -100, 100, 1));
        styleExpander.add_row(new SpinButtonRow('Shadow Blur Amount', settings, 'background-clock-bg-shadow-blur', 0, 100, 1));
        styleExpander.add_row(new SpinButtonRow('Shadow Width', settings, 'background-clock-bg-shadow-width', -100, 100, 1));
        styleExpander.add_row(new ColorRow('Shadow Color', settings, 'background-clock-bg-shadow-color'));

        group.add(clockExpander);
        group.add(dateExpander);
        group.add(styleExpander);

        const textBox = new Gtk.Box();
        textBox.append(new Gtk.Label({
            xalign: 0,
            label: `
            Date Formats:

            %M - minutes 00-59
            %H - hour 00-23
            %I - hour 01-12
            %k - hour 0-23
            %l - hour 1-12
            %p - AM PM
            %P - am pm

            %C - century 00-99
            %j - day of year 001-366`,
        }));
        textBox.append(new Gtk.Label({
            xalign: 0,
            label: `
            %a - weekday abr
            %A - weekday name
            %b - monthname abr
            %B - monthname name
            %Y - year 2000
            %d - day 01-31
            %e - day 1-31
            %m - month 01-12`,
        }));

        group.add(textBox);
    }

    _addCustomFontRow(settings, switchName, settingName) {
        const row = new SwitchRow('Custom Font', settings, switchName);
        const fontBtn = new Gtk.FontButton({
            valign: Gtk.Align.CENTER,
            use_size: false,
            use_font: true,
            level: Gtk.FontChooserLevel.FAMILY,
            font: settings.get_string(settingName),
        });
        fontBtn.connect('font-set', () => {
            const font = fontBtn.get_font_family().get_name();
            settings.set_string(settingName, font);
        });
        row.add_suffix(fontBtn);
        return row;
    }
});

var QuickSettingsTweaksPage = GObject.registerClass(
class QuickSettingsTweaksPage extends SubPage {
    _init(settings) {
        super._init('Quick Settings Tweaks', settings);

        const group = new Adw.PreferencesGroup({title: 'Quick Settings Tweaks'});
        this.add(group);

        group.add(new SpinButtonRow('Menu Width', settings, 'quick-settings-menu-width', 250, 500, 5));
        group.add(new DropDownRow('Style', settings, 'quick-settings-style', ['Stock', 'Normal', 'Compact', 'Separated']));
        group.add(new SwitchRow('Adjust Roundness', settings, 'quick-settings-adjust-roundness'));
        group.add(new SwitchRow('Show Real Name', settings, 'quick-settings-user-real-name', 'On Normal Style'));
        group.add(new SwitchRow('Show Notifications', settings, 'quick-settings-show-notifications'));

        const levelsExpander = new ExpanderRow('Show System Levels', settings, 'quick-settings-show-system-levels');
        levelsExpander.add_row(new SwitchRow('Battery', settings, 'quick-settings-levels-show-battery'));
        levelsExpander.add_row(new SwitchRow('Storage', settings, 'quick-settings-levels-show-storage'));
        levelsExpander.add_row(new SwitchRow('CPU', settings, 'quick-settings-levels-show-cpu'));
        levelsExpander.add_row(new SwitchRow('RAM', settings, 'quick-settings-levels-show-ram'));
        levelsExpander.add_row(new SwitchRow('Temperature', settings, 'quick-settings-levels-show-temp'));
        group.add(levelsExpander);

        const mediaExpander = new ExpanderRow('Show Media', settings, 'quick-settings-show-media');
        const preferRow = new EntryRow('Show Preferred Only', settings, 'quick-settings-media-prefer');
        const preferSwitch = new Gtk.Switch({
            active: settings.get_boolean('quick-settings-media-prefer-one'),
            valign: Gtk.Align.CENTER,
        });
        settings.bind('quick-settings-media-prefer-one',
            preferSwitch, 'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        preferRow.add_suffix(preferSwitch);
        mediaExpander.add_row(preferRow);
        mediaExpander.add_row(new DropDownRow('Style', settings, 'quick-settings-media-style', ['Normal', 'Linear', 'Full']));
        mediaExpander.add_row(new SpinButtonRow('Cover Roundness', settings, 'quick-settings-media-cover-roundness', 0, 42, 1));
        mediaExpander.add_row(new SpinButtonRow('Cover Width', settings, 'quick-settings-media-cover-width', 40, 500, 5));
        mediaExpander.add_row(new SpinButtonRow('Cover Height', settings, 'quick-settings-media-cover-height', 40, 300, 5));
        mediaExpander.add_row(new SwitchRow('Fade', settings, 'quick-settings-media-fade', MEDIA_SUBTITLE_FADE));
        const titleExpander = new ExpanderRow('Show Title', settings, 'quick-settings-media-show-text');
        titleExpander.add_row(new DropDownRow('Title Align', settings, 'quick-settings-media-text-align', ['Left', 'Center', 'Right']));
        titleExpander.add_row(new DropDownRow('Title Position', settings, 'quick-settings-media-text-position', ['Top', 'Bottom']));
        mediaExpander.add_row(titleExpander);
        mediaExpander.add_row(new SwitchRow('Show Volume Slider', settings, 'quick-settings-media-show-volume', MEDIA_SUBTITLE));
        mediaExpander.add_row(new SwitchRow('Show Loop and Shuffle', settings, 'quick-settings-media-show-loop-shuffle', MEDIA_SUBTITLE));
        group.add(mediaExpander);

        const appMixer = new ExpanderRow('Show Application Volume Mixer', settings, 'quick-settings-show-app-volume-mixer');
        appMixer.add_row(new SwitchRow('Show Description', settings, 'quick-settings-app-volume-mixer-show-description'));
        appMixer.add_row(new SwitchRow('Show Name', settings, 'quick-settings-app-volume-mixer-show-name'));
        group.add(appMixer);

        const togglesGroup = new Adw.PreferencesGroup({title: 'Toggles'});
        this.add(togglesGroup);

        togglesGroup.add(new SwitchRow('Wired', settings, 'quick-settings-show-wired'));
        togglesGroup.add(new SwitchRow('Wifi', settings, 'quick-settings-show-wifi'));
        togglesGroup.add(new SwitchRow('Modem', settings, 'quick-settings-show-modem'));
        togglesGroup.add(new SwitchRow('Network Bluetooth', settings, 'quick-settings-show-network-bt'));
        togglesGroup.add(new SwitchRow('VPN', settings, 'quick-settings-show-vpn'));
        togglesGroup.add(new SwitchRow('Bluetooth', settings, 'quick-settings-show-bluetooth'));
        togglesGroup.add(new SwitchRow('Power', settings, 'quick-settings-show-power'));
        togglesGroup.add(new SwitchRow('Airplane Mode', settings, 'quick-settings-show-airplane'));
        togglesGroup.add(new SwitchRow('Rotate', settings, 'quick-settings-show-rotate'));
        togglesGroup.add(new SwitchRow('Background Apps', settings, 'quick-settings-show-bg-apps'));
    }
});
