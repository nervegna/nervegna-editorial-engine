import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    this.logFile = path.join(LOG_DIR, `engine-${this.getDateString()}.log`);
  }

  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  log(level, message, ...args) {
    if (LOG_LEVELS[level] < this.level) return;

    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    const fullMessage = args.length > 0
      ? `${logMessage} ${JSON.stringify(args)}`
      : logMessage;

    console.log(fullMessage);

    fs.appendFileSync(this.logFile, fullMessage + '\n', 'utf8');
  }

  debug(message, ...args) {
    this.log('DEBUG', message, ...args);
  }

  info(message, ...args) {
    this.log('INFO', message, ...args);
  }

  warn(message, ...args) {
    this.log('WARN', message, ...args);
  }

  error(message, ...args) {
    this.log('ERROR', message, ...args);
  }
}

export const logger = new Logger(process.env.LOG_LEVEL || 'INFO');
export default logger;
