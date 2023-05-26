import type { NextRouter } from 'next/router'
import type { ReactNode } from 'react'

export const CRAWLER_PATH = "results/crawler"
export const networks = [
    {
        label: 'zcashd',
        value: 'zcashd',
        paths: {
            crawler: CRAWLER_PATH,
            tests: "results/zcashd"
        },
        default: true,
    },
    {
        label: 'Zebra',
        paths: {
            crawler: CRAWLER_PATH,
            tests: "results/zebra"
        },
        value: 'zebra',
    },
    {
        label: 'Xrpl',
        paths: {
            crawler: CRAWLER_PATH,
            tests: "results/rippled"
        },
        value: 'xrpl',
    }
] as const;

export type ZiggNetwork = typeof networks[number];

export const parseNetwork = (urlQuery?: NextRouter['query']): ZiggNetwork | undefined => {
    let network = urlQuery?.network
    if (!network) return

    if (Array.isArray(network)) network = network[0]

    return networks.find(n => n.value === network)
}
