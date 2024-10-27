"use strict";

import GLib from 'gi://GLib';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';

import { PopupMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'
import * as CheckBox from 'resource:///org/gnome/shell/ui/checkBox.js';

import { Monitor } from '../base/monitor.js';
import { buildIcon } from '../base/ui-component-store.js';
import * as System from '../base/systemInterface.js';
import { DockerMonitorItem } from './dockerMonitorItem.js';

const isContainerUp = (container) => container.status.indexOf("Up") > -1;

/**
 * Get the status of a container from the status message obtained with the docker command
 *
 * @param {String} statusMessage The status message
 *
 * @return {String} The status in ['running', 'paused', 'stopped']
 */
const getStatus = (statusMessage) => {
  let status = "undefined";
  if (statusMessage.indexOf("Exited") > -1) status = "stopped";
  if (statusMessage.indexOf("Up") > -1) status = "running";
  if (statusMessage.indexOf("Paused") > -1) status = "paused";

  return status;
};

const activeStatus = ["running", "paused"];

// Docker icon as panel menu
export const DockerMenu = GObject.registerClass(
  class DockerMenu extends Monitor {
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

      this.icon = buildIcon("docker", undefined, 16);
      this.addChild(this.icon);

      const loading = _("Loading...");
      this.buttonText = new St.Label({
        text: loading,
        style_class: 'panel-label',
        y_align: Clutter.ActorAlign.CENTER,
      });
      this.addChild(this.buttonText);
      this.addChild(new St.Label({
        text: 'Docker',
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
      if (System.dependencies.hasPodman || System.dependencies.hasDocker) {
        this.show();
      }
    }

    destroy() {
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
    // It allows to have up-to-date information on docker containers
    async _refreshMenu(force) {
      try {
        if (this.menu.isOpen || force) {
          const containers = await System.getContainers();
          this._updateCountLabel(
            containers.filter((container) => isContainerUp(container)).length
          );
          this._feedMenu(containers, force)
            .catch((e) =>
              this.menu.addMenuItem(new PopupMenuItem(e.message))
            );
        }
      } catch (e) {
        logError(e);
      }
    }

    _checkServices() {
      if (!System.dependencies.hasPodman && !System.dependencies.hasDocker) {
        let errMsg = _("Please install Docker or Podman to use this plugin");
        this.menu.addMenuItem(new PopupMenuItem(errMsg));
        throw new Error(errMsg);
      }
    }

    async _checkDockerRunning() {
      if (!System.dependencies.hasPodman && !(await System.isDockerRunning())) {
        let errMsg = _(
          "Please start your Docker service first!\n(Seems Docker daemon not started yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _checkUserInDockerGroup() {
      if (!System.dependencies.hasPodman && !(await System.isUserInDockerGroup)) {
        let errMsg = _(
          "Please put your Linux user into `docker` group first!\n(Seems not in that yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _check() {
      return Promise.all([
        this._checkServices(),
        this._checkDockerRunning(),
        //this._checkUserInDockerGroup()
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

        const dockerCount = await System.getContainerCount();
        this._updateCountLabel(dockerCount);

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
      const toggle = new CheckBox.CheckBox(
        'Show Inactive containers'
      );
      toggle.checked = this.showInactive;
      toggle.connect('clicked', () => {
        this.showInactive = toggle.checked;
        this.isTogglePending = true;
        this._refreshMenu();
      });
      this.addMenuRow(toggle, 0, 2, 1);
    }

    async _feedMenu(dockerContainers, force) {
      await this._check();
      if (
        force||
        this.isTogglePending||
        !this._containers ||
        dockerContainers.length !== this._containers.length ||
        dockerContainers.some((currContainer, i) => {
          const container = this._containers[i];

          return (
            currContainer.project !== container.project ||
            currContainer.name !== container.name ||
            isContainerUp(currContainer) !== isContainerUp(container)
          );
        })
      ) {
        this.clearMenu();
        await this._addToggleOptions();
        this._containers = dockerContainers;
        this._containers.filter((container) => activeStatus.includes(getStatus(container.status))).forEach((container) => {
          const subMenu = new DockerMonitorItem(
            container.project,
            container.name,
            getStatus(container.status),
            this.showInactive
          );
          this.addMenuRow(subMenu, 0, 2, 1);
        });
        this._containers.filter((container) => !activeStatus.includes(getStatus(container.status))).forEach((container) => {
          const subMenu = new DockerMonitorItem(
            container.project,
            container.name,
            getStatus(container.status),
            this.showInactive
          );
          this.addMenuRow(subMenu, 0, 2, 1);
        });
        this.isTogglePending = false;
        if (!this._containers.length) {
          this.menu.addMenuItem(new PopupMenuItem("No containers detected"));
        }
      }
    }
  }
);
