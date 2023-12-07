import St from "gi://St";
import Gio from "gi://Gio";
import { getExtensionObject } from "../../extension.js";


export const buildIcon = (iconName, styleClass = "system-status-icon", iconSize = "16") => {
  const gicon = Gio.icon_new_for_string(
    `${getExtensionObject().path}/icons/${iconName}.svg`
  );
  return new St.Icon({
    gicon: gicon,
    style_class: styleClass,
    icon_size: iconSize,
  });
};


export default {
    buildIcon
}