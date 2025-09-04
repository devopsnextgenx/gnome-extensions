"use strict";

import GLib from 'gi://GLib';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { PopupMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'
import * as CheckBox from 'resource:///org/gnome/shell/ui/checkBox.js';

import { Monitor } from '../base/monitor.js';
import { buildIcon } from '../base/ui-component-store.js';
import * as System from '../base/systemInterface.js';
import { OllamaMonitorItem } from './ollamaMonitorItem.js';

const isModelUp = (model) => model.status.indexOf("Up") > -1;

// Docker icon as panel menu
export const OllamaMonitor = GObject.registerClass(
  class OllamaMonitor extends Monitor {
    _init(name, uuid) {
      super._init(name, uuid);
      this._refreshCount = this._refreshCount.bind(this);
      this._refreshMenu = this._refreshMenu.bind(this);
      this._feedMenu = this._feedMenu.bind(this);
      this._updateCountLabel = this._updateCountLabel.bind(this);
      this._timeout = null;

      this.settings.connectObject(
        "changed::refresh-delay", this._reloadPref.bind(this),
        "changed::button-size", this._reloadPref.bind(this),
        this
      );

      this._refreshDelay = this.settings.get_int("refresh-delay");

      this.showInactive = true;
      this.isTogglePending = false;

      this.icon = buildIcon("llama-icon", undefined, 16);
      this.addChild(this.icon);

      const loading = _("Loading...");
      this.buttonText = new St.Label({
        text: loading,
        style_class: 'panel-label',
        y_align: Clutter.ActorAlign.CENTER,
      });
      this.addChild(this.buttonText);
      this.addChild(new St.Label({
        text: 'Ollama',
        style_class: 'panel-label',
        y_align: Clutter.ActorAlign.CENTER,
      }));

      this._buildMenu();
    }

    _buildMenu() {
      this.menu.connect("open-state-changed", this._refreshMenu.bind(this));
      const loading = _("Loading...");
      this.menu.addMenuItem(new PopupMenuItem(loading));

      this._refreshCount();
      if (System.dependencies.hasOllama) {
        this.show();
      }
    }

    destroy() {
      if (this.timeoutId) {
        GLib.Source.remove(this.timeoutId);
        this.timeoutId = null;
      }
      this.clearLoop();
      super.destroy();
    }

    _refreshDelayChanged() {
      this._refreshDelay = this.settings.get_int("refresh-delay");
      // Use a debounced function to avoid running the refresh every time the user changes the value
      this._refreshCount();
    }

    _updateCountLabel(count) {
      if (this.buttonText.get_text() !== count) {
        this.buttonText.set_text(count.toString(10));
      }
    }

    // Refresh  the menu everytime the user opens it
    // It allows to have up-to-date information on llama models
    async _refreshMenu(force) {
      try {
        if (this.menu.isOpen || force) {
          const models = await System.getModels();
          this._updateCountLabel(
            models.filter((model) => isModelUp(model)).length
          );
          this._feedMenu(models, force)
            .catch((e) =>
              this.menu.addMenuItem(new PopupMenuItem(e.message))
            );
        }
      } catch (e) {
        logError(e);
      }
    }

    _checkServices() {
      if (!System.dependencies.hasOllama) {
        let errMsg = _("Please install Ollama using 'curl -fsSL https://ollama.com/install.sh | sh'");
        this.clearMenu();
        this.menu.addMenuItem(new PopupMenuItem(errMsg));
        throw new Error(errMsg);
      }
    }

    async _checkOllamaRunning() {
      if (!System.dependencies.hasOllama && !(await System.isOllamaRunning())) {
        let errMsg = _(
          "Please start your Ollama service first!\n(Seems Ollama daemon not started yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _check() {
      return Promise.all([
        this._checkServices(),
        this._checkOllamaRunning()
      ]);
    }

    clearLoop() {
      if (this._timeout) {
        GLib.source_remove(this._timeout);
      }

      this._timeout = null;

    }

    async _refreshCount() {
      try {
        // If the extension is not enabled but we have already set a timeout, it means this function
        // is called by the timeout after the extension was disabled, we should just bail out and
        // clear the loop to avoid a race condition infinitely spamming logs about St.Label not longer being accessible
        this.clearLoop();

        const llamaCount = await System.getModelCount();
        this._updateCountLabel(llamaCount);

        // Allow setting a value of 0 to disable background refresh in the settings
        if (this._refreshDelay > 0) {
          this._timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT_IDLE,
            this._refreshDelay,
            this._refreshCount
          );
        }
      } catch (err) {
        logError(err);
        this.clearLoop();
      }
    }
    async _addToggleOptions() {
      let optionsGrid = new St.Widget({
          style_class: 'menu-grid',
          layout_manager: new Clutter.GridLayout({ orientation: Clutter.Orientation.VERTICAL }),
      });
      let hbox = new St.BoxLayout();
      optionsGrid.add_child(hbox);
      const toggle = new CheckBox.CheckBox(
        'Show Inactive models'
      );
      toggle.checked = this.showInactive;
      toggle.connect('clicked', () => {
        this.showInactive = toggle.checked;
        this.isTogglePending = true;
        this._refreshMenu();
      });
      hbox.add(toggle);
      this.addMenuRow(optionsGrid, 0, 2, 1);
    }

    async _feedMenu(llamaModels, force) {
      await this._check();
      if (
        force||
        this.isTogglePending||
        !this._models ||
        llamaModels.length !== this._models.length ||
        llamaModels.some((currModel, i) => {
          const model = this._models[i];

          return (
            currModel.name !== model.name ||
            isModelUp(currModel) !== isModelUp(model)
          );
        })
      ) {
        this.clearMenu();
        this._addToggleOptions();
        this._models = llamaModels;
        this._models.forEach((model) => {
          const isActive = model.name === this.settings.get_string("llm-model");
          console.log(model.name, this.settings.get_string("llm-model"));
          const button = new St.Button({ style_class: `button action-button` });
          button.child = buildIcon(isActive ? 'ball': 'ball-empty', `${isActive ? 'active-context ': 'inactive-context'}`, 10);
          this.timeoutId;
          button.connect('clicked', () => {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
              Main.notify("GNOME Extension: dev-container-manager", `Updated llm model for use to ${model.name} successful!!!`);
              this.settings.set_string("llm-model", `${model.name}`);
            }, 1000);
          });
          this.addMenuRow(button, 0, 1, 1);

          const subMenu = new OllamaMonitorItem(
            model.name,
            model.status,
            model.size,
            this.showInactive
          );
          this.addMenuRow(subMenu, 1, 1, 1);
        });
        this.isTogglePending = false;
        if (!this._models.length) {
          this.menu.addMenuItem(new PopupMenuItem("No models detected"));
        }
      }
    }
  }
);
