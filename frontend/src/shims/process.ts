// Minimal process shim for browsers that lack a process polyfill (e.g., Safari)
// so code that reads process.env does not throw ReferenceError.
(function () {
  try {
    const w: any = window as any;
    if (!w.process) {
      w.process = { env: {} };
    } else if (!w.process.env) {
      w.process.env = {};
    }
  } catch {
    // ignore
  }
})();

// Make this file a module under --isolatedModules
export {};
