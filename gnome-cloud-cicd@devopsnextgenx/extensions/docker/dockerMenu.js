"use strict";

import GLib from 'gi://GLib';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';

import { PopupMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'

import { getExtensionObject } from '../../extension.js'
import { Monitor } from '../base/monitor.js'
import * as Docker from './dockerExtension.js'
import { DockerSubMenu } from './dockerSubMenuMenuItem.js'

const isContainerUp = (container) => container.status.indexOf("Up") > -1;

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
      this.settings = getExtensionObject().getSettings(
        "io.k8s.framework.gnome-cloud-cicd"
      );

      this._refreshDelay = this.settings.get_int("refresh-delay");

      const gicon = Gio.icon_new_for_string(
        getExtensionObject().path + "/icons/docker.svg"
      );
      //const panelIcon = (name = "docker-symbolic", styleClass = "system-status-icon") => new St.Icon({ gicon: gioIcon(name), style_class: styleClass, icon_size: "16" });
      this.icon = new St.Icon({
        gicon: gicon,
        style_class: "system-status-icon",
        icon_size: "16",
      });
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
      this.settings.connect(
        "changed::refresh-delay",
        this._refreshCount
      );
      this.menu.connect("open-state-changed", this._refreshMenu.bind(this));
      const loading = _("Loading...");
      this.menu.addMenuItem(new PopupMenuItem(loading));

      this._refreshCount();
      if (Docker.hasPodman || Docker.hasDocker) {
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
          const containers = await Docker.getContainers();
          this._updateCountLabel(
            containers.filter((container) => isContainerUp(container)).length
          );
          this._feedMenu(containers).catch((e) =>
            this.menu.addMenuItem(new PopupMenuItem(e.message))
          );
        }
      } catch (e) {
        logError(e);
      }
    }

    _checkServices() {
      if (!Docker.hasPodman && !Docker.hasDocker) {
        let errMsg = _("Please install Docker or Podman to use this plugin");
        this.menu.addMenuItem(new PopupMenuItem(errMsg));
        throw new Error(errMsg);
      }
    }

    async _checkDockerRunning() {
      if (!Docker.hasPodman && !(await Docker.isDockerRunning())) {
        let errMsg = _(
          "Please start your Docker service first!\n(Seems Docker daemon not started yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _checkUserInDockerGroup() {
      if (!Docker.hasPodman && !(await Docker.isUserInDockerGroup)) {
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

        const dockerCount = await Docker.getContainerCount();
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

    async _feedMenu(dockerContainers) {
      await this._check();
      if (
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
        this.menu.removeAll();
        this._containers = dockerContainers;
        this._containers.forEach((container) => {
          const subMenu = new DockerSubMenu(
            container.project,
            container.name,
            container.status
          );
          this.menu.addMenuItem(subMenu);
        });
        if (!this._containers.length) {
          this.menu.addMenuItem(new PopupMenuItem("No containers detected"));
        }
      }
    }
  }
);
