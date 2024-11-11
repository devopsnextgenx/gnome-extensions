imports.gi.versions.Gtk = '3.0';
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const WebKit2 = imports.gi.WebKit2;

function log(message) {
    console.log('window.js: ' + message);
}

function prepareCookieStorage() {
    const appName = 'dev-container-manager-app';
    const cookieFilename = 'cookies.sqlite';

    const xdgDataHome = GLib.getenv('XDG_DATA_HOME') || GLib.build_filenamev([GLib.get_home_dir(), '.local', 'share']);
    const appDataDir = GLib.build_filenamev([xdgDataHome, appName]);

    log('Creating cookie storage directory: ' + appDataDir);
    GLib.mkdir_with_parents(appDataDir, 0o700);
    return GLib.build_filenamev([appDataDir, cookieFilename]);
}

function createWindow(x, y, width, height, chatLink) {
    log('Creating window');
    const appWindow = new Gtk.Window({
        type: Gtk.WindowType.TOPLEVEL,
        default_width: width,
        default_height: height,
        title: 'Ollama Chat GUI'
    });

    appWindow.set_decorated(false);
    appWindow.set_keep_above(true);

    log(`Calculated position: x=${x}, y=${y}`);
    log(`Entry Chat link: chatLink=${chatLink}`);

    appWindow.move(x, y);

    const scrolledWindow = new Gtk.ScrolledWindow();
    const cookieStorage = prepareCookieStorage();
    const webContext = WebKit2.WebContext.get_default();
    const cookieManager = webContext.get_cookie_manager();
    cookieManager.set_persistent_storage(cookieStorage, WebKit2.CookiePersistentStorage.SQLITE);

    const webView = new WebKit2.WebView({ web_context: webContext });
    scrolledWindow.add(webView);
    webView.load_uri(chatLink);

    appWindow.add(scrolledWindow);
    appWindow.connect('destroy', () => Gtk.main_quit());
    appWindow.show_all();
    log('Window created and shown at calculated position');
}

Gtk.init(null);

const [x, y, width, height, chatLink] = ARGV;
createWindow(parseInt(x), parseInt(y), parseInt(width), parseInt(height), chatLink);
Gtk.main();
log('Script execution completed');
