import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const files = fileURLToPath(new URL("./files", import.meta.url).href);

function writeWebsocketServer(base) {
  writeFileSync(
    `${base}/socket-io.js`,
    `
import { Server } from 'socket.io';
import { get_hooks } from "./internal.js";

async function initWs(server) {
  const hooks = await get_hooks();
  const handler = hooks['handleSocketIo'];
  handler(new Server(server));
}

export { initWs };
`
  );
}

/** @type {import('.').default} */
export default function (opts = {}) {
  const { out = "build", precompress, envPrefix = "", polyfill = true } = opts;

  return {
    name: "adapter-node-socket-io",

    async adapt(builder) {
      const tmp = builder.getBuildDirectory("adapter-node-socket-io");

      builder.rimraf(out);
      builder.rimraf(tmp);
      builder.mkdirp(tmp);

      builder.log.minor("Copying assets");
      builder.writeClient(`${out}/client${builder.config.kit.paths.base}`);
      builder.writePrerendered(
        `${out}/prerendered${builder.config.kit.paths.base}`
      );

      if (precompress) {
        builder.log.minor("Compressing assets");
        await Promise.all([
          builder.compress(`${out}/client`),
          builder.compress(`${out}/prerendered`),
        ]);
      }

      builder.log.minor("Building server");

      builder.writeServer(tmp);

      writeFileSync(
        `${tmp}/manifest.js`,
        `export const manifest = ${builder.generateManifest({
          relativePath: "./",
        })};\n\n` +
          `export const prerendered = new Set(${JSON.stringify(
            builder.prerendered.paths
          )});\n`
      );

      writeWebsocketServer(tmp);

      const pkg = JSON.parse(readFileSync("package.json", "utf8"));

      // we bundle the Vite output so that deployments only need
      // their production dependencies. Anything in devDependencies
      // will get included in the bundled code
      const bundle = await rollup({
        input: {
          index: `${tmp}/index.js`,
          manifest: `${tmp}/manifest.js`,
          "socket-io": `${tmp}/socket-io.js`,
        },
        external: [
          // dependencies could have deep exports, so we need a regex
          ...Object.keys(pkg.dependencies || {}).map(
            (d) => new RegExp(`^${d}(\\/.*)?$`)
          ),
        ],
        plugins: [
          nodeResolve({ preferBuiltins: true }),
          commonjs({ strictRequires: true }),
          json(),
        ],
      });

      await bundle.write({
        dir: `${out}/server`,
        format: "esm",
        sourcemap: true,
        chunkFileNames: `chunks/[name]-[hash].js`,
      });

      builder.copy(files, out, {
        replace: {
          ENV: "./env.js",
          HANDLER: "./handler.js",
          MANIFEST: "./server/manifest.js",
          SERVER: "./server/index.js",
          SHIMS: "./shims.js",
          WEBSOCKET: "./server/socket-io.js",
          ENV_PREFIX: JSON.stringify(envPrefix),
        },
      });

      // If polyfills aren't wanted then clear the file
      if (!polyfill) {
        writeFileSync(`${out}/shims.js`, "", "utf-8");
      }
    },
  };
}
