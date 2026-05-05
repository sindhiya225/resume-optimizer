import { spawn } from "node:child_process";
import { server } from "./index.js";

const apiPort = Number(process.env.PORT || 8787);

server.listen(apiPort, "127.0.0.1", () => {
  console.log(`API running at http://127.0.0.1:${apiPort}`);
});

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const vite = spawn(npmCommand, ["run", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

const shutdown = () => {
  vite.kill();
  server.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
