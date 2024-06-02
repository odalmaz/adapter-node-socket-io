# @almaz/adapter-node-socket-io

[Adapter](https://kit.svelte.dev/docs/adapters) for SvelteKit apps that generates a standalone Node server with support for Socket.io

This package uses the [Socket.io](https://github.com/socketio/socket.io) library

## Disclaimer
This is an testing repo.

This proyect is based on the work of [adapter-node-ws](https://github.com/carlosV2/adapter-node-ws) by Carlos Ortega.

### Installation

```bash
pnpm install https://github.com/odalmaz/adapter-node-socket-io
```

### Development
You need to add the plugin to inject the WebSocket into the same file:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import SocketIoPlugin from "@almaz/adapter-node-socket-io/plugin";

export default defineConfig({
	plugins: [sveltekit(), SocketIoPlugin()]
});

````

### Production

Simply replace your adapter in `svelte.config.js` with this one:

```ts
import adapter from "@almaz/adapter-node-socket-io/adapter";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // adapter options go here
    }),
  },
};
```

Since this adapter is based on `@sveltejs/adapter-node`, any configuration for that adapter is still valid and applicable
to this one.

## How to use

Have you configured the required environments? Good, then the only thing left is to build WebSockety code. For this,
quite simply export a function named `handleSocketIo` to your `hooks.server.ts` file:

```ts
import type { Server } from "socket.io";

export const handleSocketIo = (io: Server) => {
  io.on("connection", () => {
    socket.emit("hello", "world");
  });
};
```

## License

[MIT](LICENSE)
