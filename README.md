# radio znb

## project structure

the frontend code is in the `src` directory and is built with [vite](https://vitejs.dev/).

the backend code is in the `convex` directory.

`bun run dev` will start both the frontend and backend servers.

## http api

user-defined http routes are defined in the `convex/router.ts` file. we split these routes into a separate file from `convex/http.ts` to allow us to prevent the llm from modifying the authentication routes.
