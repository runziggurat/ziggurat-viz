import {
  ActionIcon,
  Code,
  Group,
  Highlight,
  Space,
  Text,
  Title,
} from '@mantine/core'
import { useOs } from '@mantine/hooks'
import { IconQuestionMark } from '@tabler/icons'
import { FC, useMemo } from 'react'
import { Column, useGlobalFilter, useTable } from 'react-table'
import { capitalize } from '../utils/helpers'
import { HoverCard } from './hover-card'
import { ScrollableTable } from './scrollable-table'

export interface TestColumnType {
  id: string
  result: 'pass' | 'fail' | 'error'
  suite_name: string
}

interface Props {
  data: TestColumnType[]
  title: string
}

export const TestsTable: FC<Props> = ({ data, title }) => {
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
    <>
      <Title size="h2" mt="lg">
        {title}
      </Title>
      <ScrollableTable height={'calc(100vh - 60px)'} tableInst={tableInst} />
      <Space h='md' />
    </>
  )
}
