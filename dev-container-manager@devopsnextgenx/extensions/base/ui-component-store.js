import St from "gi://St";
import Gio from "gi://Gio";

import { ActionIcon } from '../base/actionIcon.js';

import { getExtensionObject } from "../../extension.js";

export const actionIcon = (containerName, name = "empty", style = { "class":"action-button" }, action) => {
  const actionIconWidget = new ActionIcon(`${containerName}-${name}`, `${containerName}-${name}`);
  let button = new St.Button({ style_class: `${name != 'empty' && action ? 'button' : 'empty-icon'} action-button` });
  let iconSize = action ? style.iconSize : (style.iconSize ? style.iconSize + 4: undefined);
  button.child = buildIcon(name, `${style.class}`, iconSize);
  actionIconWidget.addChild(button);
  action && button.connect('clicked', () => action.fn()); // 
  return actionIconWidget;
}

export const buildIcon = (iconName, styleClass = "system-status-icon", iconSize) => {
  const gicon = Gio.icon_new_for_string(
    `${getExtensionObject().path}/icons/${iconName}.svg`
  );

  let settings = getExtensionObject().getSettings(
    "org.gnome.shell.extensions.dev-container-manager"
  );

  iconSize = iconSize || settings.get_int("icon-size");

  return new St.Icon({
    gicon: gicon,
    style_class: styleClass,
    icon_size: iconSize,
  });
};

export default {
  actionIcon,
  buildIcon
}