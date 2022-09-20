import { Center, Container } from '@mantine/core'
import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { isInt, parseJSON } from '../utils/helpers'

import { Navbar, NavbarProps } from '../components/navbar'

type TestResults = {
  suite_name: string
  tests_count: number
  tests: { name: string; result: 'pass' | 'fail' | 'error' }[]
}[]

type Data = { test_results: TestResults }

const Home: NextPage<{ data: Data }> = ({ data }) => {
  // console.log(data)
  const results = data.test_results

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
  return (
    <div>
      <Head>
        <title>GUI</title>
        <meta name="description" content="TODO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar links={links} />
      <Container>
        <Center>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </Center>
      </Container>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async context => {
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
        name,
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
      data: { test_results: results },
    },
  }
}

export default Home
