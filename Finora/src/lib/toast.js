// Simple non-blocking toast helper
let toastFn = null;

export function registerToast(fn) {
  toastFn = fn;
}

export function showToast(msg, type = "info") {
  if (toastFn) toastFn(msg, type);
  else console.log("[Toast]", msg);
}