/**
 * Formats a date string into an elapsed time string (e.g. "2min", "3h", "5d", "2mo")
 * @param dateString ISO date string (e.g. "2024-11-15T13:13:45.630Z")
 * @returns Formatted elapsed time string
 */
export function formatElapsedTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Define time units in milliseconds and their display formats
    const timeUnits = [
        { limit: 60 * 1000, divisor: 1000, unit: 's' },           // seconds
        { limit: 60 * 60 * 1000, divisor: 60 * 1000, unit: 'min' }, // minutes
        { limit: 24 * 60 * 60 * 1000, divisor: 60 * 60 * 1000, unit: 'h' }, // hours
        { limit: 7 * 24 * 60 * 60 * 1000, divisor: 24 * 60 * 60 * 1000, unit: 'd' }, // days
        { limit: 30 * 24 * 60 * 60 * 1000, divisor: 7 * 24 * 60 * 60 * 1000, unit: 'w' }, // weeks
        { limit: 365 * 24 * 60 * 60 * 1000, divisor: 30 * 24 * 60 * 60 * 1000, unit: 'mo' }, // months
        { limit: Infinity, divisor: 365 * 24 * 60 * 60 * 1000, unit: 'y' } // years
    ];

    // Find the appropriate time unit
    const timeUnit = timeUnits.find(unit => diffMs < unit.limit) || timeUnits[timeUnits.length - 1];
    const value = Math.floor(diffMs / timeUnit.divisor);

    return `${value}${timeUnit.unit}`;
}
