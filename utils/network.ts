import type { NextRouter } from 'next/router'
import type { ReactNode } from 'react'

export const networks: ZiggNetwork[] = [
    {
        label: 'zcashd',
        value: 'zcashd',
        default: true,
    },
    {
        label: 'Zebra',
        value: 'zebra',
    },
]

export interface ZiggNetwork {
    label: ReactNode
    value: string
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
