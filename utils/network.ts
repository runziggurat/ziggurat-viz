import type { NextRouter } from 'next/router'

export const CRAWLER_PATH = "results/crawler"
export const networks = [
    {
        label: 'zcashd',
        value: 'zcashd',
        default: true,
        paths: {
            crawler: CRAWLER_PATH,
            tests: "results/zcashd"
        },
        image: "",
        description: "",
    },
    {
        label: 'Zebra',
        value: 'zebra',
        paths: {
            crawler: CRAWLER_PATH,
            tests: "results/zebra"
        },
        image: "",
        description: "",
    },
    {
        label: 'Xrpl',
        value: 'xrpl',
        paths: {
            crawler: CRAWLER_PATH,
            tests: "results/rippled"
        },
        image: "",
        description: "",
    }
] as const;
export const pages = ['home', 'force', 'geo'] as const;

export type ZiggNetwork = typeof networks[number];
export type ZiggPage = typeof pages[number];

export const parseNetwork = (urlQuery?: NextRouter['query']): ZiggNetwork | undefined => {
    let network = urlQuery?.network
    if (!network) return

    if (Array.isArray(network)) network = network[0]

    return networks.find(n => n.value === network)
}

export const parsePage = (pathname: string): ZiggPage => {
    const str = pathname.split('/')[2]
    return pages.find(p => p === str) || pages[0]
}
