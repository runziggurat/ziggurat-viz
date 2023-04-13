import { Container } from '@mantine/core'
import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { parseJSON } from '../utils/helpers'

import { Navbar } from '../components/navbar'
import { useMemo } from 'react'
import { TestsTable, TestsTableProps } from '../components/tests-table'

import { CrawlerCard } from '../components/crawler-card'
import { CONTENT_MAX_WIDTH } from '../utils/constants'
import assert from 'assert'
import { parseNetwork } from '../utils/network'

type TestResults = {
  full_name: string
  result: 'pass' | 'fail'
  exec_time: string
}[]

type Data = { test_results: TestResults; crawler_data: any }

const Home: NextPage<{ data: Data }> = ({
  data: { test_results: results, crawler_data: crawlerData },
}) => {
  const tables: TestsTableProps['tables'] = useMemo(() => {
    const suites: Record<string, TestResults> = {}
    results.forEach(test => {
      const suite_name = test.full_name.split('::')[1]
      if (!suites[suite_name]) {
        suites[suite_name] = [test]
      } else suites[suite_name].push(test)
    })

    return Object.entries(suites).map(([suite_name, tests]) => ({
      suite_name,
      tests: tests.map(({ full_name, result, exec_time }) => {
        let match = full_name.match(
          /[r|c|p](?<idx>\d{3})(_t(?<part>\d+))?_(?<name>.+)$/
        )
        let id: string, test_name: string
        if (!match || !match.groups) {
          id = suite_name
          test_name = full_name.split('::').pop() || 'Error'
        } else {
          const { idx, name, part } = match.groups
          test_name = name
          id = `zg-${suite_name}-${idx}`.toLocaleUpperCase()
          if (part) {
            id += ` (part ${part})`
          }
        }
        return {
          id,
          test_name,
          result,
          exec_time,
        }
      }),
    }))
  }, [results])

  return (
    <div>
      <Head>
        <title>Ziggurat Explorer</title>
        <meta
          name="description"
          content="The peer-to-peer Network Testing and Stability Framework."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar>
        <Container style={{ maxWidth: CONTENT_MAX_WIDTH }}>
          <CrawlerCard title="Crawler Results" data={crawlerData} />
          <TestsTable header="Test Results" tables={tables} />
        </Container>
      </Navbar>
    </div>
  )
}

export async function getStaticPaths() {
  return {
    paths: [
      { params: { network: 'zcashd' } },
      { params: { network: 'zebra' } },
    ],
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async context => {
  const network = parseNetwork(context.params)

  if (!network) {
    return {
      notFound: true,
    }
  }

  const tests = await fetch(
    `https://raw.githubusercontent.com/runziggurat/${network.paths.tests}`
  )
  assert(tests.ok, 'Fetching tests data failed.')

  const crawler = await fetch(
    `https://raw.githubusercontent.com/runziggurat/${network.paths.crawler}`
  )
  assert(crawler.ok, 'Fetching crawler data failed.')
  
  const crawler_data = (await crawler.json()).result
  // Delete unused data to reduce bundle size
  delete crawler_data.node_addrs
  delete crawler_data.node_network_types
  delete crawler_data.nodes_indices

  // Parse valid json lines and filter out junk
  const test_results: TestResults = (await tests.text())
    .split('\n')
    .map(parseJSON)
    .filter(Boolean)
    .filter(
      entry => entry.type === 'test' && ['ok', 'failed'].includes(entry.event)
    )
    .map(({ event, exec_time, name }) => ({
      full_name: name,
      result: event === 'ok' ? 'pass' : 'fail',
      exec_time,
    }))

  return {
    props: {
      data: { test_results, crawler_data },
    },
    // Refresh every day
    revalidate: 24 * 60 * 60,
  }
}

export default Home
