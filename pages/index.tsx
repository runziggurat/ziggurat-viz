import { Code, Container, ScrollArea, Space } from '@mantine/core'
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { isInt, parseJSON } from '../utils/helpers'

import { Navbar, NavbarProps } from '../components/navbar'
import { useMemo } from 'react'
import { TestColumnType, TestsTable } from '../components/tests-table'

import crawlerData from '../utils/mock-crawler-data.json'
import { CrawlerCard } from '../components/crawler-card'

type TestResults = {
  suite_name: string
  tests_count: number
  tests: { full_name: string; result: 'pass' | 'fail' | 'error' }[]
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

  // Flatten results for now
  const data = useMemo(
    () =>
      results.reduce<TestColumnType[]>((cumm, curr) => {
        return cumm.concat(
          curr.tests.map(test => ({
            id: test.full_name.split('::').pop() || 'Error',
            suite_name: test.full_name.split('::')[1],
            result: test.result,
          }))
        )
      }, []),
    [results]
  )
  return (
    <div>
      <Head>
        <title>GUI</title>
        <meta name="description" content="TODO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar links={links} />
      <Container>
        <CrawlerCard title="Crawler Results" data={crawlerData} />
        <TestsTable title="Test Results" data={data} />
      </Container>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const res = await fetch(
    'https://raw.githubusercontent.com/zeapoz/ziggurat/json-tests/zcashd-suite.log'
  )
  const raw = await res.text()
  const results: TestResults = []
  const entries: any[] = []
  raw.split('\n').forEach(line => {
    const parsed = parseJSON(line)
    // TODO parse additional output?
    if (parsed) entries.push(parsed)
  })

  entries.forEach((entry, idx) => {
    const { type, event, name } = entry
    if (type === 'suite' && event === 'started') {
      // Create new suite
      return results.push({
        suite_name: `${results.length}`, // default name
        tests: [],
        tests_count: 0,
      })
    }
    // Add tests to current suite
    if (type === 'test' && event !== 'started') {
      const suite = results[results.length - 1]

      suite.tests.push({
        full_name: name,
        result: event === 'ok' ? 'pass' : 'fail',
      })
      suite.tests_count += 1

      if (isInt(suite.suite_name)) {
        // update suite name
        const sn = name.split('::')[1]
        suite.suite_name = sn
      }
    }
  })

  return {
    props: {
      data: { test_results: results, crawler_data: crawlerData },
    },
  }
}

export default Home
