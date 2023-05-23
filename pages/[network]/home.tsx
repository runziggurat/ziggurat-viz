import { Container } from '@mantine/core'
import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { parseJSON } from '../../utils/helpers'

import { Navbar } from '../../components/navbar'
import { useMemo } from 'react'
import { TestsTable, TestsTableProps } from '../../components/tests-table'

import { CrawlerCard } from '../../components/crawler-card'
import { CONTENT_MAX_WIDTH, ZCASH_BUCKET } from '../../utils/constants'
import { parseNetwork } from '../../utils/network'

import * as gcloud from '@google-cloud/storage'
import { getLatestTimestamp } from '../../utils/gcloud'
import { networkStaticPaths } from '../../utils/next'

type TestResults = {
  full_name: string
  result: 'pass' | 'fail'
  exec_time: string
}[]

type Data = { test_results: TestResults; crawler_data: any; meta_data: any }

const Home: NextPage<{ data: Data }> = ({
  data: { test_results: results, crawler_data: crawlerData, meta_data: meta },
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
      <Navbar metaData={meta}>
        <Container style={{ maxWidth: CONTENT_MAX_WIDTH }}>
          <CrawlerCard title="Crawler Results" data={crawlerData} />
          <TestsTable header="Test Results" tables={tables} />
        </Container>
      </Navbar>
    </div>
  )
}

export const getStaticPaths = networkStaticPaths;

export const getStaticProps: GetStaticProps<{ data: Data }> = async context => {
  const network = parseNetwork(context.params)
  if (!network) {
    return {
      notFound: true,
    }
  }

  const storage = new gcloud.Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    credentials: {
      client_email: process.env.GCLOUD_CLIENT_EMAIL,
      private_key: process.env.GCLOUD_PRIVATE_KEY,
    },
  })

  const bucket = storage.bucket(ZCASH_BUCKET)
  const testsPath = `results/${network.value}/latest.jsonl`
  const crawlerPath = 'results/crawler/latest.json'

  const updated_at = await getLatestTimestamp(bucket, 'results/crawler');

  const [tests] = await bucket.file(testsPath).download()
  // Parse valid json lines and filter out junk
  const test_results: TestResults = tests
    .toString()
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

  const [crawler] = await bucket.file(crawlerPath).download()
  const crawler_data = JSON.parse(crawler.toString()).result
  // Delete unused fields
  delete crawler_data.node_addrs
  delete crawler_data.node_network_types
  delete crawler_data.nodes_indices

  return {
    props: {
      data: {
        test_results,
        crawler_data,
        meta_data: { updated_at },
      },
    },
    // Refresh every day
    revalidate: 24 * 60 * 60,
  }
}

export default Home
