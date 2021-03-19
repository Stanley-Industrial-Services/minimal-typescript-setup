import { InfluxDB /* HttpError */ } from '@influxdata/influxdb-client';
import { /* OrgsAPI, */ BucketsAPI } from '@influxdata/influxdb-client-apis';
import { InfluxUrl, /* org, */ token } from '../../env';

const influxDB = new InfluxDB({ url: InfluxUrl, token });

export async function createBucket({ orgID, name }: { orgID: string; name: string }): Promise<any> {
    console.log('*** Get buckets by name ***');
    const bucketsAPI = new BucketsAPI(influxDB);
    const body: any =  { orgID, name };

    console.log(`*** Create Bucket "${name}" ***`);
    // creates a bucket, entity properties are specified in the "body" property
    return bucketsAPI.postBuckets({ body });
}

export default createBucket;
