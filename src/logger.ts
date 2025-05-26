export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any> | undefined;
}

class Logger {
  private logLevel: LogLevel;
  private context: string;

  constructor(context: string = "App", logLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.logLevel = process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (level > this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: this.context,
      metadata,
    };

    const levelName = LogLevel[level];
    const timestamp = entry.timestamp.toISOString();
    const contextStr = this.context ? `[${this.context}]` : "";

    let logMessage = `${timestamp} ${levelName} ${contextStr} ${message}`;

    if (metadata) {
      logMessage += ` ${JSON.stringify(metadata)}`;
    }

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
    }
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`, this.logLevel);
  }
}

export const createLogger = (context: string): Logger => new Logger(context);
export default Logger;
