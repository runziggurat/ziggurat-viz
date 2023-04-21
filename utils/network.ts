import type { NextRouter } from 'next/router'
import type { ReactNode } from 'react'

const crawler = "results/crawler"
export const networks = [
    {
        label: 'zcashd',
        value: 'zcashd',
        paths: {
            crawler,
            tests: "results/zcashd"
        },
        default: true,
    },
    {
        label: 'Zebra',
        paths: {
            crawler,
            tests: "results/zebra"
        },
        value: 'zebra',
    },
    {
        label: 'Xrpl',
        paths: {
            crawler,
            tests: "results/rippled"
        },
        value: 'xrpl',
    }
] as const satisfies ReadonlyArray<ZiggNetwork>

export interface ZiggNetwork {
    label: ReactNode
    value: string
    paths: {
        tests: string
        crawler: string
    }
    description?: string
    image?: string
    default?: boolean
}

export const parseNetwork = (urlQuery?: NextRouter['query']) => {
    let network = urlQuery?.network
    if (!network) return

    if (Array.isArray(network)) network = network[0]

    return networks.find(n => n.value === network)
}
