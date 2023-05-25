import { ZiggNetwork, networks } from './network';
import { getLatestTimestamp } from './gcloud'
import * as gcloud from '@google-cloud/storage'
import { ZCASH_BUCKET } from './constants';

export async function networkStaticPaths() {
    return {
        paths: networks.map(({ value: network }) => ({ params: { network } })),
        fallback: false,
    }
}

export interface VizData {
    viz_state: any
    meta_data: { updated_at: number }
}

export async function fetchVizData(_: ZiggNetwork): Promise<VizData> {
    const storage = new gcloud.Storage({
        projectId: process.env.GCLOUD_PROJECT_ID,
        credentials: {
            client_email: process.env.GCLOUD_CLIENT_EMAIL,
            private_key: process.env.GCLOUD_PRIVATE_KEY,
        },
    })
    const bucket = storage.bucket(ZCASH_BUCKET)
    const dataPath = 'results/crawler/latest.viz.json'

    const [res] = await bucket.file(dataPath).download()
    const viz_state = JSON.parse(res.toString())

    const updated_at = await getLatestTimestamp(bucket, 'results/crawler')
    return {
        viz_state,
        meta_data: {
            updated_at
        }
    }
}