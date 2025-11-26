import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
import chalk from 'chalk';

const isProduction = Boolean(process.env.GCP_PROJECT_ID);

const transports: winston.transport[] = [];

if (isProduction) {
  transports.push(
    new LoggingWinston({
      projectId: process.env.GCP_PROJECT_ID,
    })
  );
} else {
  const devFormat = winston.format.combine(
    winston.format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.splat(),
    winston.format.errors(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      let restString = '';

      const formatted = { ...rest };

      // Format Error objects to show all details
      if (formatted.error instanceof Error) {
        formatted.error = {
          message: formatted.error.message,
          name: formatted.error.name,
          stack: formatted.error.stack?.split('\n') || [],
          ...(Object.keys(formatted.error).length > 0 && formatted.error),
        };
      }

      // Format standalone stack traces with proper line breaks
      if (formatted.stack && typeof formatted.stack === 'string') {
        formatted.stack = formatted.stack.split('\n');
      }

      // Only add data if there's meaningful content
      const hasData = Object.keys(formatted).length > 0 &&
                      JSON.stringify(formatted) !== '{}';

      if (hasData) {
        restString = '\n' + JSON.stringify(formatted, null, 2);
      }

      const formattedTimestamp = chalk.grey(`[${timestamp}]`);
      return `${formattedTimestamp} ${level}: ${message}${restString}`;
    })
  );

  transports.push(
    new winston.transports.Console({
      format: devFormat,
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  transports: transports,
});

export default logger;
