import { spawn, type ChildProcess } from "node:child_process";

export interface Step {
  label: string;
  cwd: string;
  argv: string[];
}

export interface StepResult {
  step: Step;
  /** Exit code; 1 for a step that a signal ended or that could not start. */
  status: number;
  elapsedMs: number;
  /** stdout and stderr in arrival order; empty when the step wrote to the terminal. */
  output: string;
}

const running = new Set<ChildProcess>();

export function killRunningSteps() {
  for (const child of running) child.kill();
}

/** `capture: false` writes to the terminal; `capture: true` returns the output in the result. */
export function runStep(step: Step, capture: boolean): Promise<StepResult> {
  const start = Date.now();
  const [command, ...args] = step.argv;
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const finish = (status: number) =>
      resolve({ step, status, elapsedMs: Date.now() - start, output: Buffer.concat(chunks).toString("utf8") });
    const child = spawn(command, args, {
      cwd: step.cwd,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    running.add(child);
    child.stdout?.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr?.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", (error) => {
      running.delete(child);
      chunks.push(Buffer.from(`${command}: ${error.message}\n`));
      finish(1);
    });
    child.on("close", (code) => {
      running.delete(child);
      finish(code ?? 1);
    });
  });
}

/** Runs `tasks` with at most `limit` in flight; results keep the order of `tasks`. */
export async function runPool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, worker));
  return results;
}
