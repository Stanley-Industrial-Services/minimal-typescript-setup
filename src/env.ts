import dotenv from 'dotenv';

dotenv.config();

/** InfluxDB v2 URL */
export const InfluxUrl: string = process.env.INFLUX_URL || 'no URL found';

/** InfluxDB authorization token */
export const token: string = process.env.INFLUX_TOKEN || 'invalid Token';

/** Organization within InfluxDB  */
export const org: string = process.env.INFLUX_ORG || 'invalid ORG';

/**InfluxDB bucket used in examples  */
export const bucket: string = process.env.INFLUX_BUCKET || 'bucket not specified';

export const mods = {
    InfluxUrl,
    token,
    org,
    bucket
};

export default mods;
