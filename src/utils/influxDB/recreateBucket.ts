import { InfluxDB, HttpError } from '@influxdata/influxdb-client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';
import { InfluxUrl as url, org,  token } from '../../env';

const influxDB = new InfluxDB({ url, token });

/**
 *
 *
 * @export
 * @param {any} name
 * @returns {Promise<void>}
 *
 * example:
 *
 *       recreateBucket('example-bucket')
 *          .then(() => console.log('\nFinished SUCCESS'))
 *           .catch((error) => {
 *               console.error(error);
 *               console.log('\nFinished ERROR');
 *           });
 *
 */
export async function recreateBucket(name: string): Promise<void> {
    console.log('*** Get organization by name ***');

    const orgsAPI = new OrgsAPI(influxDB);
    const { orgs = [] } = await orgsAPI.getOrgs({ org });

    if ( !orgs.length) {
        console.error(`No organization named "${org}" found!`);
    }

    const orgID = orgs[0].id || '';
    console.log(`Using organization "${org}" identified by "${orgID}"`);

    console.log('*** Get buckets by name ***');
    const bucketsAPI = new BucketsAPI(influxDB);

    try {
        const buckets = await bucketsAPI.getBuckets({ orgID, name });

        if (buckets && buckets.buckets && buckets.buckets.length) {
            console.log(`Bucket named "${name}" already exists"`);
            const bucketID = buckets.buckets[0].id || '';

            console.log(`*** Delete Bucket "${name}" identified by "${bucketID}" ***`);
            await bucketsAPI.deleteBucketsID({ bucketID });
        }
    } catch (e) {
        if (e instanceof HttpError && e.statusCode == 404) {
            // OK, bucket not found
            console.log(`Bucket ${name} in organization ${orgID} not found`);
        } else {
            throw e;
        }
    }

    const body: any = { orgID, name };

    console.log(`*** Create Bucket "${name}" ***`, body);
    // creates a bucket, entity properties are specified in the "body" property
    const bucket = await bucketsAPI.postBuckets({ body });
    console.log(JSON.stringify(bucket, (key, value) => (key === 'links' ? undefined : value), 2));
}

export default recreateBucket;