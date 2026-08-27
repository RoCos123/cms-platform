import { register } from "node:module";

/** Se încarcă cu `node --import ./e2e/alias.mjs …`. Vezi `alias-hooks.mjs`. */
register("./alias-hooks.mjs", import.meta.url);
