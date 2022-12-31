/**
 * Call `op` if the `value` is `undefined`, otherwise returns the `value` itself.
 */
export function orElse<T>(value: T | undefined, op: () => T): T {
  if (value == undefined) {
    return op();
  }
  return value;
}
