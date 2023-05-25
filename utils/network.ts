import type { NextRouter } from 'next/router'
import type { ReactNode } from 'react'

export const networks: ZiggNetwork[] = [
    {
        label: 'zcashd',
        value: 'zcashd',
        paths: {
            crawler: 'zcash/main/results/crawler/latest.json',
            tests: 'zcash/main/results/zcashd/latest.jsonl',
        },
        default: true,
    },
    {
        label: 'Zebra',
        paths: {
            crawler: 'zcash/main/results/crawler/latest.json',
            tests: 'zcash/main/results/zebra/latest.jsonl'
        },
        value: 'zebra',
    },
    // TODO xrpl
]

export interface ZiggNetwork {
    label: ReactNode
    value: 'zcashd' | 'zebra' | 'xrpl'
    paths: {
        crawler: string
        tests: string
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
