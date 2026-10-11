/**
 * Sanitizes numeric input strings:
 * - Allows empty string "" so user can backspace and clear the input
 * - Removes unwanted leading zero when typing digits (e.g. "0123213" -> "123213", "00" -> "0")
 * - Preserves decimals starting with "0." (e.g. "0.5", "0.01")
 */
export function sanitizeNumberInput(value: string): string {
  if (value === "") return "";
  if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
    const stripped = value.replace(/^0+/, "");
    return stripped === "" ? "0" : stripped;
  }
  return value;
}
