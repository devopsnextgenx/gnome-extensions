import St from "gi://St";
import Gio from "gi://Gio";

import { ActionIcon } from '../base/actionIcon.js';

import { getExtensionObject } from "../../extension.js";

export const actionIcon = (containerName, name = "empty", style = { "class":"action-button", "styleText": "padding: 6px 6px;" }, action) => {
  const actionIconWidget = new ActionIcon(`${containerName}-${name}`, `${containerName}-${name}`);

  let settings = getExtensionObject().getSettings(
    "org.gnome.shell.extensions.dev-container-manager"
  );
  style.iconSize = style.iconSize || settings.get_int("icon-size");
  
  let button = new St.Button({ style_class: `${name != 'empty' && action ? 'button' : 'empty-icon'} action-button`, style: `${style.styleText}` });
  style.iconSize = name == "empty" ? 12 : style.iconSize;
  button.child = buildIcon(name, `${style.class}`, style.iconSize);
  actionIconWidget.addChild(button);
  action && button.connect('clicked', () => action.fn());
  return actionIconWidget;
}

export const buildIcon = (iconName, styleClass = "system-status-icon", iconSize = 10) => {
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

export const buildLabel = (labelText, styleClass = 'item-label', style) => {
  let settings = getExtensionObject().getSettings(
    "org.gnome.shell.extensions.dev-container-manager"
  );
  let iconSize = settings.get_int("icon-size");
  let padding = (iconSize-16)/2;

  style = style ? style : `padding: ${padding}px 6px;`;

  return new St.Label({ text: _(`${labelText}`), style_class: `${styleClass}` , style: `${style}` });
}

export default {
  actionIcon,
  buildIcon
}