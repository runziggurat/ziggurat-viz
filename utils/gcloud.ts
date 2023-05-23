import type { Bucket } from '@google-cloud/storage'

export const getLatestTimestamp = async (bucket: Bucket, path: string) => {
    const [files] = await bucket.getFiles({
        prefix: path,
    })

    // Figure out the latest date.
    const date = files
        .map(file => file.name)
        .map(file => {
            const [y, m, d] =
                file.match(/(\d{4})-(\d{2})-(\d{2})\.json\.gz$/)?.slice(1) || []
            return new Date(+y, +m - 1, +d)
        })
        .filter(date => !isNaN(date.getTime()))
        .sort((a, b) => b.getTime() - a.getTime())
        .shift()

    const time = date?.getTime() || 0
    return time
}