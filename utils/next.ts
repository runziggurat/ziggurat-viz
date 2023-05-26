import { ZiggNetwork, networks } from './network';
import { getLatestTimestamp } from './gcloud'
import * as gcloud from '@google-cloud/storage'
import { XRPL_BUCKET, ZCASH_BUCKET } from './constants';
import { VizData } from './types';


export async function networkStaticPaths() {
    return {
        paths: networks.map(({ value: network }) => ({ params: { network } })),
        fallback: false,
    }
}

export async function fetchVizData(network: ZiggNetwork): Promise<VizData | null> {
    try {
        const storage = new gcloud.Storage({
            projectId: process.env.GCLOUD_PROJECT_ID,
            credentials: {
                client_email: process.env.GCLOUD_CLIENT_EMAIL,
                private_key: process.env.GCLOUD_PRIVATE_KEY,
            },
        })
        const bucket = storage.bucket(network.value === "xrpl" ? XRPL_BUCKET : ZCASH_BUCKET)
        const dataPath = network.paths.crawler + '/latest.viz.json'

        const [res] = await bucket.file(dataPath).download()
        const viz_state = JSON.parse(res.toString())

        const updated_at = await getLatestTimestamp(bucket, network.paths.crawler)
        return {
            viz_state,
            meta_data: {
                updated_at
            }
        }
    } catch (err) {
        console.error(err)
        return null
    }
}