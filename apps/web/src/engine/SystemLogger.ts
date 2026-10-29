import { mistralLocalService } from './mistralLocalService';

/**
 * SystemLogger.ts
 * 
 * A centralized, purified logging substrate for the MyOS ecosystem.
 * Handles toggling between browser console visibility and silent backend telemetry.
 */

interface LogOptions {
    source?: string;
    telemetry?: boolean;
    silent?: boolean;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEFAULT_SILENT = true; // By default, background noise is silent in the console

export const SystemLogger = {
    log: (message: string, options: LogOptions = {}) => {
        const { source = 'SYSTEM', telemetry = true, silent = DEFAULT_SILENT } = options;
        const formattedMessage = `[${source.toUpperCase()}] ${message}`;

        // 1. Always send to telemetry sink if requested
        if (telemetry) {
            mistralLocalService.logTelemetry({
                id: `log-${Date.now()}`,
                source: source as any,
                intent: message,
                status: 'log-event',
                timestamp: Date.now(),
                context: 'system-logger'
            });
        }

        // 2. Only log to browser console if NOT silent or if in debug mode
        if (!silent || !IS_PRODUCTION) {
            console.log(formattedMessage);
        }
    },

    warn: (message: string, options: LogOptions = {}) => {
        const { source = 'SYSTEM', telemetry = true } = options;
        const formattedMessage = `[${source.toUpperCase()}] WARNING: ${message}`;

        if (telemetry) {
            mistralLocalService.logTelemetry({
                id: `warn-${Date.now()}`,
                source: source as any,
                intent: message,
                status: 'warn-event',
                timestamp: Date.now(),
                context: 'system-logger'
            });
        }

        console.warn(formattedMessage);
    },

    error: (message: string, options: LogOptions = {}) => {
        const { source = 'SYSTEM', telemetry = true } = options;
        const formattedMessage = `[${source.toUpperCase()}] CRITICAL: ${message}`;

        if (telemetry) {
            mistralLocalService.logTelemetry({
                id: `err-${Date.now()}`,
                source: source as any,
                intent: message,
                status: 'error-event',
                timestamp: Date.now(),
                context: 'system-logger'
            });
        }

        console.error(formattedMessage);
    }
};
