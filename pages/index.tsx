import {
  ActionIcon,
  Center,
  Code,
  Container,
  Group,
  Highlight,
  Space,
  Text,
  Title,
} from '@mantine/core'
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { capitalize, isInt, parseJSON } from '../utils/helpers'

import { Navbar, NavbarProps } from '../components/navbar'
import { ScrollableTable } from '../components/scrollable-table'
import { useMemo } from 'react'
import { Column, useTable, useGlobalFilter } from 'react-table'
import { IconQuestionMark } from '@tabler/icons'
import { HoverCard } from '../components/hover-card'

type TestResults = {
  suite_name: string
  tests_count: number
  tests: { full_name: string; result: 'pass' | 'fail' | 'error' }[]
}[]

type Data = { test_results: TestResults }

interface TestColumnType {
  id: string
  result: 'pass' | 'fail' | 'error'
  suite_name: string
}

const Home: NextPage<{ data: Data }> = ({
  data: { test_results: results },
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

  const columns: Column<TestColumnType>[] = useMemo(
    () => [
      {
        Header: 'Suite',
        accessor: 'suite_name', // accessor is the "key" in the data
        Cell: ({ value, state }) => (
          <Text weight="bold">
            <Highlight highlight={(state as any).globalFilter}>
              {capitalize(value)}
            </Highlight>
          </Text>
        ),
      },
      {
        Header: 'Id',
        accessor: 'id',
        Cell: ({ value, state }) => (
          <Group spacing="xs">
            <Code>
              <Highlight highlight={(state as any).globalFilter}>
                {value}
              </Highlight>
            </Code>
            <HoverCard
              target={
                <ActionIcon size="xs" variant="filled" color="dark" radius="xl">
                  <IconQuestionMark size={12} />
                </ActionIcon>
              }
            >
              <div>TODO</div>
              <div>
                <i>Ex: ZG-RESISTANCE-005 (part 2)</i>
              </div>
              <div>Some additional notes</div>
            </HoverCard>
          </Group>
        ),
      },
      {
        Header: 'Result',
        accessor: 'result',
        Cell: ({ value, state }) => (
          <Text
            color={
              value === 'pass' ? 'green' : value === 'fail' ? 'yellow' : 'red'
            }
            weight={800}
          >
            <Highlight highlight={(state as any).globalFilter}>
              {value}
            </Highlight>
          </Text>
        ),
      },
    ],
    []
  )

  const tableInst = useTable({ columns, data }, useGlobalFilter)

  return (
    <div>
      <Head>
        <title>GUI</title>
        <meta name="description" content="TODO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar links={links} />
      <Container>
        <Space h="md" />
        <Title size="h2" mt="lg">
          Test Results
        </Title>
        <ScrollableTable height={'calc(100vh - 150px)'} tableInst={tableInst} />
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
      data: { test_results: results },
    },
  }
}

export default Home
