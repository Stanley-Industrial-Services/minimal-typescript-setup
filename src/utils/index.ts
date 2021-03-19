import dbUtil from './mysql';

export * from './influxDB/createBucket';
export * from './influxDB/recreateBucket';

export { dbUtil };

/**
 *
 *
 * @export
 * @param {number} [ms=0]
 * @returns {Promise<void>}
 *
 * example:
 *     await delay(5000);   // will wait 5 seconds before continue execution
 */
export function delay(ms = 500): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}
