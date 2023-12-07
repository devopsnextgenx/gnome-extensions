"use strict";

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export const dockerCommandsToLabels = {
  start: "Start",
  restart: "Restart",
  stop: "Stop",
  pause: "Pause",
  unpause: "Unpause",
  exec: "Exec",
  logs: "Logs",
};

export const hasDocker = !!GLib.find_program_in_path("docker");
export const hasPodman = !!GLib.find_program_in_path("podman");
export const hasXTerminalEmulator = !!GLib.find_program_in_path("x-terminal-emulator");

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
 * Get an array of containers
 * @return {Array} The array of containers as { project, name, status }
 */
export const getContainers = async () => {
  const psOut = await execCommand(["docker", "ps", "-a", "--format", "{{.Names}},{{.Status}}"]);

  const images = psOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(',');
    return {
      name,
      status,
    }
  });

  return Promise.all(images.map(({name}) => execCommand(["docker", "inspect", "-f", "{{index .Config.Labels \"com.docker.compose.project\"}}", name])))
    .then((values) => values.map((commandOutput, i) => ({
      project: commandOutput.split('\n')[0].trim(),
        ...images[i]
    })))

};

/**
 * Get the number of containers
 * @return {Number} The number of running containers
 */
export const getContainerCount = async () => {
  const psOut = await execCommand(["docker", "ps", "--format", "{{.Names}},{{.Status}}"]);

  const images = psOut.split('\n').filter((line) => line.trim().length).map((line) => {
    const [name, status] = line.split(',');
    return {
      name,
      status,
    }
  });
  return images.length;

};

/**
 * Run a Docker command
 * @param {String} command The command to run
 * @param {String} containerName The container
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
export const runCommand = async (command, containerName, callback) => {
  var cmd = hasXTerminalEmulator
    ? ["x-terminal-emulator", "-e", "sh", "-c"]
    : ["gnome-terminal", "--", "sh", "-c"];
  switch (command) {
    case "exec":
      cmd = [...cmd, "'docker exec -it " + containerName + " sh; exec $SHELL'"];
      GLib.spawn_command_line_async(cmd.join(" "));
      break;
    case "logs":
      cmd = [
        ...cmd,
        "'docker logs -f --tail 2000 " + containerName + "; exec $SHELL' ",
      ];
      GLib.spawn_command_line_async(cmd.join(" "));
      break;
    default:
      cmd = ["docker", command, containerName];
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
    throw e;
  }
  return execProm;
}
