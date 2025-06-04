// backend/src/utils/logger.js
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    const additionalData = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] ${level.toUpperCase()}: ${formattedMessage}${additionalData}`;
  }

  info(message, ...args) {
    console.log(this.formatMessage('info', message, ...args));
  }

  error(message, ...args) {
    console.error(this.formatMessage('error', message, ...args));
  }

  warn(message, ...args) {
    console.warn(this.formatMessage('warn', message, ...args));
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }
}

export const logger = new Logger();