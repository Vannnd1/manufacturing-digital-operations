/**
 * Structured application logger with automatic sensitive field redaction.
 * Outputs machine-parseable JSON in production and readable logs in development.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "jwt",
  "authorization",
  "cookie",
  "database_url",
  "apikey",
  "api_key",
  "access_token",
  "refresh_token",
]);

/**
 * Recursively redacts sensitive fields from objects, arrays, and strings.
 */
export function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Redact JWT tokens if present in raw string
    if (data.startsWith("Bearer ") || /^ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(data)) {
      return "[REDACTED_TOKEN]";
    }
    // Redact database connection strings containing credentials
    if (/postgres(?:ql)?:\/\/[^:]+:[^@]+@/i.test(data)) {
      return data.replace(/(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@/i, "$1$2:***@");
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === "object") {
    const redacted: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret")) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }

  return data;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message?: string;
  requestId?: string;
  [key: string]: any;
}

class StructuredLogger {
  private isProduction = process.env.NODE_ENV === "production";
  private isTest = process.env.NODE_ENV === "test";

  private formatEntry(level: LogLevel, eventOrMessage: string, meta?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event: eventOrMessage,
    };

    if (meta) {
      const safeMeta = redactSensitiveData(meta);
      Object.assign(entry, safeMeta);
    }

    return entry;
  }

  private write(level: LogLevel, entry: LogEntry): void {
    // In test mode, suppress output unless DEBUG=true to keep test reports clean
    if (this.isTest && !process.env.DEBUG) {
      return;
    }

    const output = this.isProduction
      ? JSON.stringify(entry)
      : `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.event}${
          entry.message ? `: ${entry.message}` : ""
        }${entry.requestId ? ` (req: ${entry.requestId})` : ""}${
          entry.durationMs !== undefined ? ` [${entry.durationMs}ms]` : ""
        }`;

    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  public info(event: string, meta?: Record<string, any>): void {
    const entry = this.formatEntry("info", event, meta);
    this.write("info", entry);
  }

  public warn(event: string, meta?: Record<string, any>): void {
    const entry = this.formatEntry("warn", event, meta);
    this.write("warn", entry);
  }

  public error(event: string, meta?: Record<string, any>): void {
    const entry = this.formatEntry("error", event, meta);
    this.write("error", entry);
  }

  public debug(event: string, meta?: Record<string, any>): void {
    const entry = this.formatEntry("debug", event, meta);
    this.write("debug", entry);
  }

  /**
   * Helper for testing logger output
   */
  public createEntry(level: LogLevel, event: string, meta?: Record<string, any>): LogEntry {
    return this.formatEntry(level, event, meta);
  }
}

export const logger = new StructuredLogger();
