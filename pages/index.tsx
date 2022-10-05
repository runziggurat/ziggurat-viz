import { Container } from '@mantine/core'
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { parseJSON } from '../utils/helpers'

import { Navbar, NavbarProps } from '../components/navbar'
import { useMemo } from 'react'
import { TestsTable, TestsTableProps } from '../components/tests-table'

import crawlerData from '../utils/mock-crawler-data.json'
import { CrawlerCard } from '../components/crawler-card'

type TestResults = {
  full_name: string
  result: 'pass' | 'fail'
  exec_time: string
}[]

type Data = { test_results: TestResults; crawler_data: any }

const Home: NextPage<{ data: Data }> = ({
  data: { test_results: results, crawler_data: crawlerData },
}) => {
  const links: NavbarProps['links'] = [
    {
      link: 'https://github.com/runziggurat/zcash',
      label: 'GitHub',
    },
    {
      link: 'https://equilibrium.co/projects/ziggurat',
      label: 'Equilibrium',
    },
  ]

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
      tests: tests.map(test => {
        let match = test.full_name.match(
          /[r|c|p](?<idx>\d{3})(_t(?<part>\d+))?_(?<name>.+)$/
        )
        let id: string, test_name: string
        if (!match || !match.groups) {
          id = suite_name
          test_name = test.full_name.split('::').pop() || 'Error'
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
          result: test.result,
        }
      }),
    }))
  }, [results])

  return (
    <div>
      <Head>
        <title>GUI</title>
        <meta name="description" content="TODO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar links={links}>
        <Container>
          <CrawlerCard title="Crawler Results" data={crawlerData} />
          <TestsTable header="Test Results" tables={tables} />
        </Container>
      </Navbar>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const res = await fetch(
    'https://raw.githubusercontent.com/zeapoz/ziggurat/7394c4904c26ebd3b30ab8789d4729790afc56a4/results/2022-06-22T13%3A06%3A26Z.jsonl'
  )
  const raw = await res.text()

  // Parse valid json lines and filter out junk
  const results: TestResults = raw
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
      data: { test_results: results, crawler_data: crawlerData },
    },
  }
}

export default Home
