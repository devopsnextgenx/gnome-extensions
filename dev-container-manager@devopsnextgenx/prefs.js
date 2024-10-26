import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class DockerContainersPreferences extends ExtensionPreferences {
    getIntervalSpinButton = () => {
        const settings = this.getSettings();
        const spin = new Gtk.SpinButton({
            valign: Gtk.Align.CENTER,
            climb_rate: 10,
            digits: 0,
            snap_to_ticks: true,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 3600,
                step_increment: 1,
                page_size: 0,
            }),
        });
        settings.bind("refresh-delay", spin, "value", Gio.SettingsBindFlags.DEFAULT);
        return spin;
    };

    getIconSize = () => {
        const settings = this.getSettings();
        const spin = new Gtk.SpinButton({
            valign: Gtk.Align.CENTER,
            climb_rate: 10,
            digits: 0,
            snap_to_ticks: true,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 3600,
                step_increment: 1,
                page_size: 0,
            }),
        });
        settings.bind("icon-size", spin, "value", Gio.SettingsBindFlags.DEFAULT);
        return spin;
    };

    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);

        const refreshInterval = new Adw.ActionRow({
            title: "Container count refresh interval. Set to 0 to disable",
        });
        group.add(refreshInterval);

        const delayInput = this.getIntervalSpinButton();

        refreshInterval.add_suffix(delayInput);
        refreshInterval.activatable_widget = delayInput;

        const iconSize = new Adw.ActionRow({
            title: "Icon Size",
        });
        
        group.add(iconSize);

        const iconSizeInput = this.getIconSize();

        iconSize.add_suffix(iconSizeInput);
        iconSize.activatable_widget = iconSizeInput;
        
        window.add(page);

        const settings = this.getSettings();

        const groupOllama = new Adw.PreferencesGroup({
            title: 'Ollama Connection',
            description: 'Configure the connections to Ollama',
        });
        page.add(groupOllama);

        // Create a new preferences row
        const url_row = new Adw.EntryRow({
            title: 'ollama url',
            text: settings.get_string('url'),
            
            // subtitle: _('Whether to show the panel indicator'),
        });
        groupOllama.add(url_row);
        settings.bind('url', url_row, 'active',  Gio.SettingsBindFlags.DEFAULT);


        // Create a new preferences row
        const bin_row = new Adw.EntryRow({
            title: 'ollama command',
            text: settings.get_string('command'),
            // subtitle: _('Whether to show the panel indicator'),
        });
        groupOllama.add(bin_row);
        settings.bind('command', bin_row, 'active',  Gio.SettingsBindFlags.DEFAULT);
    }

}

