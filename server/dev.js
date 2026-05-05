import { spawn } from "node:child_process";
import { server } from "./index.js";

const apiPort = Number(process.env.PORT || 8787);

server.listen(apiPort, "127.0.0.1", () => {
  console.log(`API running at http://127.0.0.1:${apiPort}`);
});

const vite = spawn("npm.cmd", ["run", "dev"], {
  stdio: "inherit",
  shell: false,
});

const shutdown = () => {
  vite.kill();
  server.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
