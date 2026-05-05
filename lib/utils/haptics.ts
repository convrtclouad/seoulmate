/** Light haptic tap — works on Android; silently ignored on iOS */
export function tap() {
  try { navigator.vibrate?.(10); } catch { /* ignore */ }
}

/** Double-tap confirm */
export function confirm() {
  try { navigator.vibrate?.([15, 8, 25]); } catch { /* ignore */ }
}

/** Success pulse */
export function success() {
  try { navigator.vibrate?.([20, 10, 20, 10, 50]); } catch { /* ignore */ }
}

/** Warning / danger tap */
export function warn() {
  try { navigator.vibrate?.([40, 20, 40]); } catch { /* ignore */ }
}
