import { readFileSync } from "fs";
import { Server } from "socket.io";
const sym = "socket.io.server";

/**
 * @returns {import('vite').PluginOption}
 */
export default function () {
  let command;
  let root;

  return {
    name: "socket-io-for-dev",
    configResolved(config) {
      command = config.command;
      root = config.root;
    },
    configureServer({ httpServer }) {
      globalThis[Symbol.for(sym)] = new Server(httpServer);
    },
    configurePreviewServer({ httpServer }) {
      globalThis[Symbol.for(sym)] = new Server(httpServer);
    },
    load(file) {
      if (command !== "build" && file === `${root}/src/hooks.server.ts`) {
        const lines = readFileSync(file, "utf-8").split("\n");
        lines.push(`handleSocketIo(globalThis[Symbol.for('${sym}')]);`);

        return { code: lines.join("\n") };
      }
    },
  };
}
