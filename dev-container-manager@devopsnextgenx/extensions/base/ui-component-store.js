import St from "gi://St";
import Gio from "gi://Gio";

export const buildIcon = (extension, iconName, styleClass = "system-status-icon", iconSize = "16") => {
  const gicon = Gio.icon_new_for_string(
    `${extension.path}/icons/${iconName}.svg`
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