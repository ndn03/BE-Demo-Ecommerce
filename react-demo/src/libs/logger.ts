// Simple logger implementation without external dependencies
interface Logger {
  info: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  log: (message: any, ...args: any[]) => void;
}

const createLogger = (): Logger => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    info: (message: any, ...args: any[]) => {
      if (isDevelopment) {
        console.info('ℹ️', message, ...args);
      }
    },
    error: (message: any, ...args: any[]) => {
      console.error('❌', message, ...args);
    },
    warn: (message: any, ...args: any[]) => {
      if (isDevelopment) {
        console.warn('⚠️', message, ...args);
      }
    },
    debug: (message: any, ...args: any[]) => {
      if (isDevelopment) {
        console.debug('🐛', message, ...args);
      }
    },
    log: (message: any, ...args: any[]) => {
      if (isDevelopment) {
        console.log('📝', message, ...args);
      }
    },
  };
};

const logger = createLogger();

export default logger;
