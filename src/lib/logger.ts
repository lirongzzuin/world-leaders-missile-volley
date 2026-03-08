/**
 * Structured logger with level filtering.
 * In production (NODE_ENV=production), debug/info logs are suppressed.
 *
 * @module logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';

function log(level: LogLevel, message: string, data?: unknown): void {
  if (isProd && (level === 'debug' || level === 'info')) return;

  const prefix = `[${level.toUpperCase()}] ${new Date().toISOString()}`;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (data !== undefined) {
    fn(`${prefix} ${message}`, data);
  } else {
    fn(`${prefix} ${message}`);
  }
}

const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info:  (msg: string, data?: unknown) => log('info',  msg, data),
  warn:  (msg: string, data?: unknown) => log('warn',  msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
};

export default logger;
