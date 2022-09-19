import { Center, Container } from '@mantine/core'
import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { parseJSON } from '../utils/helpers'

const Home: NextPage<{ data: any; result: any }> = ({ data, result }) => {
  console.log('result', result)
  return (
    <div>
      <Head>
        <title>GUI</title>
        <meta name="description" content="TODO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Center>
          <pre>{JSON.stringify(data, null, 2)}</pre>
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
  const data: any[] = []
  raw.split('\n').forEach(line => {
    const parsed = parseJSON(line)
    // TODO parse additional output?
    if (parsed) data.push(parsed)
  })

  const result = { started: 0, failed: 0, ok: 0 }
  data.forEach(entry => {
    const event = entry.event
    if (event === 'started') {
      result.started += 1
    } else if (event === 'failed') {
      result.failed += 1
    } else if (event === 'ok') {
      result.ok += 1
    } else {
      console.error('Weird event', event)
    }
  })

  return {
    props: {
      data,
      result,
    },
  }
}

export default Home
