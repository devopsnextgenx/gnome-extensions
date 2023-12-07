"use strict";

import GLib from 'gi://GLib';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';

import { PopupMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'

import { Monitor } from '../base/monitor.js';
import * as System from '../base/systemInterface.js';
import { KindMonitorItem } from '../kind/kindMonitorItem.js';
import { buildIcon } from '../base/ui-component-store.js';

const isContainerUp = (container) => container.status.indexOf("Up") > -1;

// Kind icon as panel menu
export const KindCluster = GObject.registerClass(
  class KindCluster extends Monitor {
    _init(name, uuid) {
      super._init(name, uuid);
      this._refreshCount = this._refreshCount.bind(this);
      this._refreshMenu = this._refreshMenu.bind(this);
      this._feedMenu = this._feedMenu.bind(this);
      this._updateCountLabel = this._updateCountLabel.bind(this);
      this._timeout = null;

      this._refreshDelay = this.settings.get_int("refresh-delay");

      this.icon = buildIcon("kind");
      this.addChild(this.icon);

      const loading = _(`Loading...`,);
      this.buttonText = new St.Label({
        text: loading,
        style_class: 'panel-label',
        y_align: Clutter.ActorAlign.CENTER,
      });
      this.addChild(this.buttonText);
      this.addChild(new St.Label({
        text: 'Kind',
        style_class: 'panel-label',
        y_align: Clutter.ActorAlign.CENTER,
      }));

      this._buildMenu();

    }

    _buildMenu() {
      this.settings.connect(
        "changed::refresh-delay",
        this._refreshCount
      );
      this.menu.connect("open-state-changed", this._refreshMenu.bind(this));
      const loading = _("Loading...");
      this.menu.addMenuItem(new PopupMenuItem(loading));

      this._refreshCount();
      if (System.hasPodman || System.hasDocker) {
        this.show();
      }
    }

    destroy() {
      super.destroy();
      this.clearLoop();
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
    // It allows to have up-to-date information on docker containers
    async _refreshMenu() {
      try {
        if (this.menu.isOpen) {
          const clusters = await System.getKindClusters();
          this._updateCountLabel(clusters.length);
          this._feedMenu(clusters)
            .catch((e) =>
              this.menu.addMenuItem(new PopupMenuItem(e.message))
            );
        }
      } catch (e) {
        logError(e);
      }
    }

    _checkServices() {
      let errMsg = undefined;
      if (!System.hasPodman && !System.hasDocker) {
        errMsg = _("Please install Docker or Podman to use this plugin");
      }
      if (!System.hasKind) {
        errMsg = _("Please install Kind to use this plugin");
      }
      if (errMsg) {
        this.menu.addMenuItem(new PopupMenuItem(errMsg));
        throw new Error(errMsg);
      };
    }

    async _checkDockerRunning() {
      if (!System.hasPodman && !(await System.isDockerRunning())) {
        let errMsg = _(
          "Please start your Docker service first!\n(Seems Docker daemon not started yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _checkUserInDockerGroup() {
      if (!System.hasPodman && !(await System.isUserInDockerGroup)) {
        let errMsg = _(
          "Please put your Linux user into `docker` group first!\n(Seems not in that yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _check() {
      return Promise.all([
        this._checkServices(),
        this._checkDockerRunning()
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

        const kindClusters = await System.getKindClusters();
        this._updateCountLabel(kindClusters.length);

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

    async _feedMenu(kindClusters) {
      await this._check();
      if (
        !this._kindClusters ||
        kindClusters.length !== this._kindClusters.length
      ) {
        this.clearMenu();
        this._kindClusters = kindClusters;
        this._kindClusters.forEach((cluster) => {
          const subMenu = new KindMonitorItem(
            cluster
          );
          this.addMenuRow(subMenu, 0, 2, 1);
        });
        if (!this._kindClusters.length) {
          this.menu.addMenuItem(new PopupMenuItem("No kind clusters detected"));
        }
      }
    }
  }
);
