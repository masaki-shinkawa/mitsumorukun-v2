#!/usr/bin/env node
import { execSync } from "node:child_process";

const port = Number(process.env.FRONTEND_PORT ?? 3000);
const isWin = process.platform === "win32";

function pidsOnPort(port) {
  if (isWin) {
    let out = "";
    try {
      out = execSync(`netstat -ano -p tcp`, { encoding: "utf8" });
    } catch {
      return [];
    }
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/);
      if (m && Number(m[1]) === port) pids.add(m[2]);
    }
    return [...pids];
  }
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: "utf8" });
    return out.split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}

function kill(pid) {
  if (isWin) {
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: "inherit" });
  } else {
    execSync(`kill -TERM ${pid}`, { stdio: "inherit" });
  }
}

const pids = pidsOnPort(port);
if (pids.length === 0) {
  console.log(`[stop-dev] no process listening on :${port}`);
  process.exit(0);
}

for (const pid of pids) {
  console.log(`[stop-dev] killing pid=${pid} on :${port}`);
  try {
    kill(pid);
  } catch (e) {
    console.warn(`[stop-dev] failed to kill ${pid}:`, e.message);
  }
}
