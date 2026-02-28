"use strict";

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { getExtensionObject } from "../../extension.js";

export const dependencies = {
};

export const checkDependencies = () => {
  dependencies['hasYq'] = !!GLib.find_program_in_path("yq");
  dependencies['hasDocker'] = !!GLib.find_program_in_path("docker");
  dependencies['hasPodman'] = !!GLib.find_program_in_path("podman");
  dependencies['hasKind'] = !!GLib.find_program_in_path("kind");
  dependencies['hasOllama'] = !!GLib.find_program_in_path("ollama");
  dependencies['hasKubectl'] = !!GLib.find_program_in_path("kubectl");
  dependencies['hasXTerminalEmulator'] = !!GLib.find_program_in_path("x-terminal-emulator");

  try {
    const file = getFile("dev-container-manager", ".local/share");
    file.make_directory_with_parents(null);
  } catch (error) {
    console.log(`storage already exists!!!`);
  }

  return dependencies;
};

export const filterTab = (input) => {
  return input.includes('\t') ? input.split("\t")[0]:input;
}

export function notify(msg, details, icon) {
  const MessageTray = Main.messageTray;
  let source = new MessageTray.Source("dev-container-manager", icon);
  let notification = new MessageTray.Notification(source, msg, details);
  notification.setTransient(false);
  Main.messageTray.add(source);
  source.notify(notification);
}

export const getFilePath = (fileName) => {
  return GLib.build_filenamev([GLib.get_home_dir(), fileName]);
};
export const getFile = (fileName, filePath = ".local/share/dev-container-manager") => {
  return Gio.File.new_for_path(getFilePath(`${filePath}/${fileName}`));
}
export const jsonToYaml = async (content) => {
  let pOut = await execCommand(["yq", "-y", "-n", content]);
  
  return pOut;
};
export const yamlToJson = async (fileName) => {
  let pOut = await execCommand(["yq", "-r", ".", fileName]);
  
  return pOut;
};

export const writeContentToFile = async (content, fileName, filePath = ".local/share/dev-container-manager") => {
  try {
    const file = getFile(fileName, filePath);
    await file.replace_contents_bytes_async(new GLib.Bytes(content), null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null, null);
  } catch (error) {
    Main.notify("GNOME Extension: dev-container-manager", error.message);
  }
}

export const createKindCluster = async (clusterName) => {
  const clusterConfig = `${GLib.get_home_dir()}/.local/share/dev-container-manager/${clusterName}.yaml`;
  let pOut = await execCommand(["kind","create","cluster","--name",clusterName,"--config",clusterConfig]);
  
  return pOut;
}

const REQUIRED_LIBS = ['Docker', 'Podman', 'Kind'];

export const getMissingDependencies = (dependencies) => {
  const missingLibs = [];

  Object.keys(dependencies).forEach(lib => !dependencies[lib] && REQUIRED_LIBS.includes(`${lib.substring(3)}`) && missingLibs.push(`${lib.substring(3)}`));

  return missingLibs;
}

/**
 * Check if Linux user is in 'docker' group (to manage Docker without 'sudo')
 * @return {Boolean} whether current Linux user is in 'docker' group or not
 */
export const isUserInDockerGroup = (() => {
  const _userName = GLib.get_user_name();
  let _userGroups = GLib.ByteArray.toString(
    GLib.spawn_command_line_sync("groups " + _userName)[1]
  );
  let _inDockerGroup = false;
  if (_userGroups.match(/\sdocker[\s\n]/g)) _inDockerGroup = true; // Regex search for ' docker ' or ' docker' in Linux user's groups

  return _inDockerGroup;
})();

/**
 * Check if docker daemon is running
 * @return {Boolean} whether docker daemon is running or not
 */
export const isDockerRunning = async () => {
  const cmdResult = await execCommand(["/bin/ps", "cax"]);
  return cmdResult.search(/dockerd/) >= 0;
};

/**
 * Check if ollama daemon is running
 * @return {Boolean} whether ollama daemon is running or not
 */
export const isOllamaRunning = async () => {
  const cmdResult = await execCommand(["/bin/ps", "efa"]);
  return cmdResult.search(/ollama/) >= 0;
};

/**
 * Get an array of containers
 * @return {Array} The array of containers as { project, name, status }
 */
export const getContainers = async () => {

  const psDockerOut = dependencies["hasDocker"] ? await execCommand(["docker", "ps", "-a", "--format", "{{.Names}},{{.Status}}"]) : "";
  const psPodmanOut = dependencies["hasPodman"] ? await execCommand(["podman", "ps", "-a", "--format", "{{.Names}},{{.Status}}"]) : "";

  const dockerImgs = psDockerOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(',');
    return {
      name,
      status,
      "provider": "docker"
    }
  });
  
  const podmanImgs = psPodmanOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(',');
    return {
      name,
      status,
      "provider": "podman"
    }
  });
  const images = [...dockerImgs, ...podmanImgs];

  const containerCmd = dependencies["hasDocker"] ? "docker" : dependencies["hasPodman"] ? "podman" : "xxx";
  
  return Promise.all(
    images.map(({ name }) => 
      execCommand([containerCmd, "inspect", "-f", "{{index .Config.Labels \"com.docker.compose.project\"}}", name])))
        .then((values) => values.map((commandOutput, i) => ({
          project: commandOutput.split('\n')[0].trim(),
          ...images[i]
        })
      )
  );
};

/**
 * Get an array of Models
 * @return {Array} The array of models
 */
export const getModels = async () => {
  const host = getExtensionObject().getSettings("org.gnome.shell.extensions.dev-container-manager").get_string('llm-url');
  const ollamaApi = `${ host }/api`
  let httpSession = new Soup.Session();
  let modelList = Soup.Message.new('GET', `${ollamaApi}/tags`);
  let psList = Soup.Message.new('GET', `${ollamaApi}/ps`);
  let models = [];
  let modelsRunning = [];
  let utf8decoder = new TextDecoder(); // default 'utf-8' or 'utf8'
  try {
      let res = httpSession.send_and_read(modelList, null);
      let raw_data = utf8decoder.decode(res.get_data())
      models = JSON.parse(raw_data)['models'];
      res = httpSession.send_and_read(psList, null);
      raw_data = utf8decoder.decode(res.get_data())
      modelsRunning = JSON.parse(raw_data)['models'];

      for (let i in models) {
        models[i].status = modelsRunning.some(mr => mr.name == models[i].name) ? "Up" : "Down";
      }
    } catch(err) {
      models.push({
        name: "No models found",
        status: "NA"
      });
    }

  return models.map((model) => {
    return {
      name: model.name,
      status: model.status,
      size:  formatBytes(model.size)
    }
  });
  
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
};

export const getKindClusters = () => {
  return new Promise(async (resolve, reject) => {
    execCommand(["kind", "get", "clusters"]).then((psOut) => resolve(psOut.split('\n').filter((line) => line.trim().length > 0)));
  });
};

export const getKubeContexts = () => {
  return new Promise(async (resolve, reject) => {
    execCommand(["kubectl", "config", "get-contexts", "-o=name"]).then((psOut) => {
      const images = psOut.split('\n').filter((line) => line.trim().length).map((name) => {
        return {
          name
        }
      });
      resolve(images);
    });
  });
};

export const getDockerCommandTest = async () => {
  const psOut = await execCommand(["docker", "ps", "-a", "--format", "{{.Names}},{{.Status}}"]);
  return psOut;
};

/**
 * Get the number of containers
 * @return {Number} The number of running containers
 */
export const getContainerCount = async () => {
  const psDockerOut = dependencies["hasDocker"] ? await execCommand(["docker", "ps", "--format", "{{.Names}},{{.Status}}"]) : "";
  const psPodmanOut = dependencies["hasPodman"] ? await execCommand(["podman", "ps", "--format", "{{.Names}},{{.Status}}"]) : "";

  const dockerImgs = psDockerOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(',');
    return {
      name,
      status,
    }
  });
  
  const podmanImgs = psPodmanOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(',');
    return {
      name,
      status,
    }
  });
  
  const images = [...dockerImgs, ...podmanImgs];

  const uniqueDockerContainers = Object.values(images.reduce((acc, current) => {
    const existing = acc[current.name];

    // Logic: 
    // 1. If we don't have this container yet, add it.
    // 2. If we have a 'docker' version but the current one is 'podman', overwrite it.
    if (!existing || (existing.provider === 'docker' && current.provider === 'podman')) {
      acc[current.name] = current;
    }

    return acc;
  }, {}));
  return uniqueDockerContainers.length;

};

/**
 * Get the number of models
 * @return {Number} The number of running models
 */
export const getModelCount = async () => {
  let psOut = await execCommand(["ollama", "ps"]);

  let models = psOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(' ');
    return {
      name,
      status,
    }
  });
  const rModels = models.length-1;

  psOut = await execCommand(["ollama", "list"]);

  models = psOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(' ');
    return {
      name,
      status,
    }
  });

  const aModels = models.length-1;

  return `${rModels}/${aModels}`;

};

/**
 * Run a Docker command
 * @param {String} command The command to run
 * @param {String} containerName The container
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
export const runDockerCommand = async (provider, command, containerName, callback) => {
  let dependencies = checkDependencies();
  let cmd = dependencies['hasXTerminalEmulator']
    ? ["x-terminal-emulator", "-e", "sh", "-c"]
    : ["gnome-terminal", "--", "sh", "-c"];
    
  switch (command) {
    case "exec":
      cmd = [...cmd, "'" + provider + " exec -it " + containerName + " sh; exec $SHELL'"];
      GLib.spawn_command_line_async(cmd.join(" "));
      break;
    case "rm":
      cmd = [provider, command, "-f", containerName];
      execCommand(cmd, callback);
      break;
    case "logs":
        cmd = [
          ...cmd,
          "'" + provider + " logs -f --tail 2000 " + containerName + "; exec $SHELL' ",
        ];
        GLib.spawn_command_line_async(cmd.join(" "));
        break;
    default:
      cmd = [provider, command, containerName];
      execCommand(cmd, callback);
  }
};

/**
 * Run a Ollama command
 * @param {String} command The command to run
 * @param {String} model The model
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
export const runOllamaCommand = async (command, model, callback) => {
  let dependencies = checkDependencies();
  let cmd = dependencies['hasXTerminalEmulator']
    ? ["x-terminal-emulator", "-e", "sh", "-c"]
    : ["gnome-terminal", "--", "sh", "-c"];
  let settings = getExtensionObject().getSettings(
      "org.gnome.shell.extensions.dev-container-manager"
  );
  let ollamaCmd = settings.get_string('llm-command');
  let spawn = false;
  switch (command) {
    case "show":
      cmd = [...cmd, "'" + ollamaCmd + " show " + model + "; exec $SHELL'"];
      spawn = true;
      break;
    case "run":
      cmd = [ollamaCmd, "run", model];
      break;
    case "stop":
      cmd = [ollamaCmd, "stop", model];
      break;
    case "rm":
      cmd = [ollamaCmd, "rm", model];
        break;
    default:
      cmd = [ollamaCmd, command, model];
  }
  spawn ? GLib.spawn_command_line_async(cmd.join(" ")) : execCommand(cmd, callback);
};

/**
 * Run a Docker command
 * @param {String} command The command to run
 * @param {String} containerName The container
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
export const runKindCommand = async (command, clusterName, callback) => {
  let dependencies = checkDependencies();
  let cmd = dependencies['hasXTerminalEmulator']
    ? ["x-terminal-emulator", "-e", "sh", "-c"]
    : ["gnome-terminal", "--", "sh", "-c"];
  switch (command) {
    case "delete":
      cmd = [
        "kind", "delete", "clusters", clusterName
      ];
      execCommand(cmd, callback);
      break;
    case "switch":
      cmd = [
        "kubectl", "config", "use-context", clusterName
      ];
      execCommand(cmd, callback);
      break;
    default:
      cmd = ["kind", command, clusterName];
      execCommand(cmd, callback);
  }
};

export async function execCommand(
  argv,
  callback /*(status, command, err) */,
  cancellable = null
) {
  let execProm = null;
  try {
    // There is also a reusable Gio.SubprocessLauncher class available
    let proc = new Gio.Subprocess({
      argv: argv,
      // There are also other types of flags for merging stdout/stderr,
      // redirecting to /dev/null or inheriting the parent's pipes
      flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    });

    // Classes that implement GInitable must be initialized before use, but
    // an alternative in this case is to use Gio.Subprocess.new(argv, flags)
    //
    // If the class implements GAsyncInitable then Class.new_async() could
    // also be used and awaited in a Promise.
    proc.init(null);
    execProm = new Promise((resolve, reject) => {
      // communicate_utf8() returns a string, communicate() returns a
      // a GLib.Bytes and there are "headless" functions available as well
      proc.communicate_utf8_async(null, cancellable, (proc, res) => {
        let ok, stdout, stderr;

        try {
          [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
          callback && callback(ok, argv.join(" "), ok ? stdout : stderr);

          if (!ok) {
            const status = proc.get_exit_status();
            throw new Gio.IOErrorEnum({
              code: Gio.io_error_from_errno(status),
              message: stderr ? stderr.trim() : GLib.strerror(status)
            });
          }
          resolve(stdout);
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (e) {
    logError(e);
    reject(e);
  }
  return execProm;
}
