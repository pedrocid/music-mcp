declare module 'applescript' {
  interface ExecFileCallback {
    (error: Error | null, result: string): void;
  }

  export function execFile(
    scriptPath: string,
    args?: string[],
    callback?: ExecFileCallback
  ): void;

  export function exec(
    script: string,
    callback: ExecFileCallback
  ): void;
} 