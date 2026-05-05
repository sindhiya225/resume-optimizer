import { spawn } from "node:child_process";
import { server } from "./index.js";

const apiPort = Number(process.env.PORT || 8787);
let vite;

const startVite = () => {
  if (vite) return;
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  vite = spawn(npmCommand, ["run", "dev"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  vite.on("exit", (code) => {
    server.close();
    process.exit(code ?? 0);
  });
};

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`API port ${apiPort} is already in use. Reusing the existing API server.`);
    startVite();
    return;
  }

  throw error;
});

server.listen(apiPort, "127.0.0.1", () => {
  console.log(`API running at http://127.0.0.1:${apiPort}`);
  startVite();
});

const shutdown = () => {
  if (vite) vite.kill();
  server.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
