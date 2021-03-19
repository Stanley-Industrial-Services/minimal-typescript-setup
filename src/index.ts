import { InfluxDB, Point } from '@influxdata/influxdb-client';
import moment from 'moment';
import { token, org, bucket, InfluxUrl } from './env';
import { dbUtil, /* delay, */ recreateBucket } from './utils';

// // You can generate a Token from the "Tokens Tab" in the UI
// const token = '6NJkb-RoZKlcTWipSa4Ev8xzRwq_G78ugQWPSXvzmDIy3ftFH5SV4PtDc4TDBgDbm_Pm4OJYg0aed17Ff2TA-A==';
// const org = 'juniornapier@hotmail.com';
// // const bucket = "juniornapier's Bucket";
// const bucket = 'RMDConnect';
// const InfluxUrl = 'https://eu-central-1-1.aws.cloud2.influxdata.com';

// const prodConfig = {
//     /* database config */
//     db: {
//         host: '127.0.0.1',
//         user: 'root',
//         password: 'dD7F9cqBP2ZmfwD6',
//         database: 'Smartlync',
//         port: 3301,
//     },
//     /* tabke config */
//     eventsTable: 'Smartlync.Events',
//     wipWopTable: 'Smartlync.WipWops',
// }

const devConfig = {
    /* database config */
    db: {
        host: '127.0.0.1',
        user: 'root',
        password: 'BQZrNR2zS9jgv3bm',
        database: 'Smartlync',
        port: 3302
    },
    /* tabke config */
    eventsTable: 'Smartlync.Events',
    wipWopTable: 'Smartlync.WipWops'
};

const influxDBConfig = {
    url: InfluxUrl,
    token,
    schema: [
        {
            measurement: 'Faults',
            fields: {
                faultEvent: 'string',
                duration: 'string'
            },
            tags: [
                // 'measurementId',
                'weldingTool',
                'faultCode',
                'studType',
                'studId',
                'deviceName',
                'bodyShop',
                'carBody',
                'plant',
                'location'
            ]
        },
        {
            measurement: 'Cycles',
            fields: {
                cycleEventId: 'string',
                duration: 'string'
            },
            tags: ['measurementId', 'weldingTool', 'faultCode', 'studType', 'studId', 'deviceName', 'bodyShop', 'plant', 'location']
        }
    ]
};

const rowsAtATime = 40357;

(async (): Promise<void> => {
    let client: any;
    let db: any;

    console.log('config options... ', { token, org, bucket, InfluxUrl });
    recreateBucket('RMDConnect');

    const timeToSecs = (duration = '00:00:00'): number => {
        const times = [3600, 60, 1];

        const results = duration.split(':').reduce((acc: number, d: string, i) => (acc += times[i] * parseInt(d)), 0);

        return isNaN(results) ? 0 : results;
    };

    // start Influx connection
    console.log('Connecting to Influx cloud... ');
    try {
        client = new InfluxDB(influxDBConfig);
    } catch (e) {
        console.error('Error: connecting to development database ', e);
        return;
    }

    // start connection to ELU database
    console.log('Connecting to dev database... ');
    try {
        db = await dbUtil.makeDb(devConfig.db);
    } catch (e) {
        console.error('Error: connecting to development database ', e);
        return;
    }

    const writeApi = client.getWriteApi(org, bucket);

    console.log('Influx ( org, bucket ) ', org, bucket);
    console.log('Mysql Rows to push ( rows, fields ) ');

    // count rows
    let cnt = 0,
        complete = false,
        cntRead = 0,
        cntWritten = 0;
    const startAt = moment()
        .subtract(26, 'week')
        .toDate();

    console.log('Starting migration from date ', startAt);
    do {
        const query = `
        SELECT 
    Events.*,Studs_Data.stud_type as studType
FROM Smartlync.Events Events, Smartlync.Studs_Data Studs_Data
where (Events.event = 'Störung' OR Events.event = 'StÃ¶rung')
    and Events.output <> 'System'
    and Events.studId <> ''
    and Events.deviceName = Studs_Data.device_name
    and Events.output = Studs_Data.outlet
ORDER BY Events.date_time LIMIT ?,?`;
        const args = [cnt, rowsAtATime];

        const [pRows = []] = await db.query(query, args);

        console.log('Retrieved ', pRows.length, ' records ', cnt);

        complete = pRows.length < rowsAtATime;

        if (pRows.length > 0) {
            cnt += pRows.length;

            cntRead = cnt;

            try {
                const points = pRows.map((row: any) =>
                    new Point('Faults')
                        // .tag('measurementId', row.id)
                        .tag('weldingTool', row.weldingTool)
                        .tag('faultCode', row.eventNumber)
                        .tag('studType', row.studType)
                        .tag('studId', row.studId)
                        .tag('deviceName', row.deviceName)
                        .tag('bodyShop', row.bodyShopId)
                        .tag('carBody', row.bodyId)
                        .tag('plant', row.plant)
                        .tag('location', row.location)
                        .intField('faultEvent', 1)
                        .floatField('duration', timeToSecs(row.duration))
                        .timestamp(row.date_time)
                );

                const results = writeApi.writePoints(points);

                cntWritten += points.length;

                console.log('migrateTable.results ( results ) ', results, pRows.length, rowsAtATime);

                // await delay(10000);
            } catch (e) {
                console.error('migrateTable.writeApi ( error ) ', e);
            }
        }
    } while (!complete);

    console.log('migrateTable.writeEnd ( completing InfluxDB writes ) ');

    writeApi
        .close()
        .then(() => {
            console.log('FINISHED');
        })
        .catch((e: any) => {
            console.error(e);
            console.log('\nFinished ERROR');

            process.exit(0);
        })
        .finally(() => {
            console.log('MysqlDB: ( prodRows ) ', cntRead, ' rows read. ');
            console.log('MysqlDB: ( devRows ) ', cntWritten, ' rows written. ');

            if (cntRead !== cntWritten) {
                console.error('Error: while processing migration data ( cntRead, cntWritten )', cntRead, cntWritten);
            }
            // process.exit(0);
        });

    // end it all
})();
