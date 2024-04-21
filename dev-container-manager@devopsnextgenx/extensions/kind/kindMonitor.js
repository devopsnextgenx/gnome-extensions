"use strict";

import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { Monitor } from '../base/monitor.js';
import * as System from '../base/systemInterface.js';
import { KindClusterItem } from '../kind/kindMonitorItem.js';
import { buildIcon } from '../base/ui-component-store.js';
import { KindClusterNode } from './kindCluster.js';

// Kind icon as panel menu
export const KindMonitor = GObject.registerClass(
  class KindMonitor extends Monitor {
    _init(name, uuid) {
      super._init(name, uuid);
      this._refreshCount = this._refreshCount.bind(this);
      this._refreshMenu = this._refreshMenu.bind(this);
      this._feedMenu = this._feedMenu.bind(this);
      this._updateCountLabel = this._updateCountLabel.bind(this);
      this._timeout = null;

      this.settings.connectObject(
        "changed::refresh-delay", this._reloadPref.bind(this),
        "changed::icon-size", this._reloadPref.bind(this),
        this
      );

      this._refreshDelay = this.settings.get_int("refresh-delay");

      this.kcPath = GLib.get_home_dir() + "/.kube/config";
      let kcFile = Gio.File.new_for_path(this.kcPath);
      this._monitor = kcFile.monitor(Gio.FileMonitorFlags.NONE, null);
      this._monitor.connect('changed', this._updateContext.bind(this));
      
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
    async _updateContext() {
      const config = await System.yamlToJson(this.kcPath);
      const currentContext = JSON.parse(config)['current-context'];
      this.newContext = currentContext;
    }
    _buildMenu() {
      this.menu.connect("open-state-changed", this._refreshMenu.bind(this));
      const loading = _("Loading...");
      this.menu.addMenuItem(new PopupMenu.PopupMenuItem(loading));
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
          const clusters = await System.getKindClusters();
          this._updateCountLabel(clusters.length);
          this._feedMenu(clusters, force)
            .catch((e) =>
              this.menu.addMenuItem(new PopupMenu.PopupMenuItem(e.message))
            );
        }
      } catch (e) {
        logError(e);
      }
    }

    _checkServices() {
      let errMsg = undefined;
      if (!System.dependencies.hasPodman && !System.dependencies.hasDocker) {
        errMsg = _("Please install Docker or Podman to use this plugin");
      }
      if (!System.dependencies.hasKind) {
        errMsg = _("Please install Kind to use this plugin");
      }
      if (errMsg) {
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
        throw new Error(errMsg);
      };
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

    async _feedMenu(kindClusters, force) {
      await this._check();
      if (
        force ||
        !this._kindClusters 
        || kindClusters.length !== this._kindClusters.length
        || this.newContext !== this.currentContext
      ) {
        this.clearMenu();
        this._kindClusters = kindClusters;
        this._kindClusters.forEach((cluster) => {
          const isActive = this.newContext === `kind-${cluster}`;
          isActive && (this.currentContext = this.newContext);
          const subMenu = new KindClusterItem(
            cluster
            );
            this.addMenuRow(buildIcon(isActive ? 'ball': '', 'active-context', 10), 0, 1, 1);
            this.addMenuRow(subMenu, 1, 1, 1);
          });
          if (!this._kindClusters.length) {
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem("No kind clusters detected"),0,2,1);
          }
          this.addMenuRow(new PopupMenu.PopupSeparatorMenuItem(),0,2,1)
          this._addClusterNode();
        }
      }
      _addClusterNode() {
        if (System.dependencies.hasYq) {
          this.addMenuRow(new PopupMenu.PopupMenuItem("Fill Name for the kind cluster and click blue icon to proceed configuring the cluster.\nInputs:\n - workers: Number of workers to spawn\n - apiPort: Used to connect kubernetes controller\n - hostHttp: Port on host to connect http requests\n - hostHttps: Port on host to connect https requests\n - podSubnet: Usually 10.2xx.0.0/16\n - serviceSubnet: Usually 10.xx.0.0/16\n\nOnce input is filled properly, you should be able to click green icon to create cluster"), 0, 2, 1);
          this.addMenuRow(new PopupMenu.PopupSeparatorMenuItem(),0,2,1)
          this.addMenuRow(new KindClusterNode('kind-node-dev', 'create-kind-node-dev'), 0, 2, 1);
        } else {
        this.addMenuRow(new PopupMenu.PopupMenuItem("Install 'yq' and 'kind' to allow creating and handling kubernetes clusters with kind.\n - Follow instructions at https://kind.sigs.k8s.io/docs/user/quick-start/#installing-with-a-package-manager\n - sudo apt install yq -y"), 0, 2, 1);
      }
    }
  }
);
