import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

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
        window.add(page);

        this.populateGeneralSettings(page);
        this.populateOllamaSettings(page);
        this.populateJarvisSettings(page);
    }
    populateGeneralSettings(page) {
        const groupGeneral = new Adw.PreferencesGroup({
            title: 'General Settings',
            description: 'Configure the general settings related to the extension for icon sizee and refresh delay'
        });
        const generalConfiguration = [{
            title: 'Icon Size',
            key: 'icon-size',
            type: 'number'
        }, {
            title: 'Refresh Delay',
            key: 'refresh-delay',
            type: 'number'
        }];

        this.addGroupKeys(groupGeneral, generalConfiguration, "General Settings");
        page.add(groupGeneral);
    };

    populateOllamaSettings(page) {
        const groupOllama = new Adw.PreferencesGroup({
            title: 'Ollama Connection',
            description: 'Configure the connections to Ollama',
        });
        const ollamaConfiguration = [{
            title: 'ollama url',
            key: 'url',
            type: 'text'
        }, {
            title: 'ollama command',
            key: 'command',
            type: 'text'
        }];
        this.addGroupKeys(groupOllama, ollamaConfiguration, "Ollama Settings");
        page.add(groupOllama);
    }

    populateJarvisSettings(page) {
        const groupJarvis = new Adw.PreferencesGroup({
            title: 'Jarvis',
            description: 'Configure the Jarvis',
        });

        const jarvisConfiguration = [{
            title: 'LLM Model',
            key: 'llm-model',
            type: 'text'
        }, {
            title: 'Human Message Background Color',
            key: 'human-message-color',
            type: 'color'
        }, {
            title: 'Human Message Text Color',
            key: 'human-message-text-color',
            type: 'color'
        }, {
            title: 'LLM Message Background Color',
            key: 'llm-message-color',
            type: 'color'
        }, {
            title: 'LLM Message Text Color',
            key: 'llm-message-text-color',
            type: 'color'
        }];
        this.addGroupKeys(groupJarvis, jarvisConfiguration, "J.A.R.V.I.S. Settings");
        page.add(groupJarvis);
    }

    addGroupKeys(group, config, sectionTitle = "") {
        const section = new Adw.ExpanderRow({ title: _(sectionTitle) });
        for (const keyConfig of config) {
            switch (keyConfig.type) {
                case 'text':
                    this.addTextRow(section, keyConfig);
                    break;
                case 'number':
                    this.addSpinButton(section, keyConfig);
                    break;
                case 'color':
                    this.addColorRow(section, keyConfig);
                    break;
                default:
                    break;
            }
        }
        group.add(section);
    }

    addColorRow(section, keyConfig) {
        const settings = this.getSettings();
        const { title, key } = keyConfig;
        const button = new Gtk.ColorButton();
        {
            const rgba = new Gdk.RGBA();
            rgba.parse(settings.get_string(key));
            button.useAlpha = true;
            button.set_rgba(rgba);
        }
        button.connect('color-set', (widget) => {
            settings.set_string(key, `${widget.get_rgba().to_string()}`);
        });

        const row = new Adw.ActionRow({ title: _(title) });
        row.add_suffix(button);
        row.activatableWidget = button;
        section.add_row(row);
    }

    addTextRow(section, keyConfig) {
        const settings = this.getSettings();
        const { title, key } = keyConfig;
        const entry = new Gtk.Entry({
            text: settings.get_string(key),
            halign: Gtk.Align.END,
            valign: Gtk.Align.CENTER,
        });
        let timeoutId;
        entry.connect('changed', widget => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                settings.set_string(key, `${widget.get_text()}`);
            }, 1000);
        });

        const row = new Adw.ActionRow({ title: _(title) });
        row.add_suffix(entry);
        row.activatableWidget = entry;
        section.add_row(row);
    }

    addSpinButton(section, keyConfig) {
        const settings = this.getSettings();
        const { title, key } = keyConfig;
        const spinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 3600,
                step_increment: 1,
                page_size: 0,
            }),
        });
        let timeoutId;
        spinButton.set_value(settings.get_int(key));
        spinButton.connect('value-changed', widget => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                settings.set_int(key, `${widget.get_value()}`);
            }, 1000);
        });
        const row = new Adw.ActionRow({ title: _(title) });
        row.add_suffix(spinButton);
        row.activatableWidget = spinButton;
        section.add_row(row);
    }
}