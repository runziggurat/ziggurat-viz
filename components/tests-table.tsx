import {
  Code,
  createStyles,
  Group,
  Highlight,
  ScrollArea,
  Space,
  Tabs,
  Text,
  TextInput,
  Title,
  Table,
  Accordion,
} from '@mantine/core'
import { useScrollIntoView } from '@mantine/hooks'
import {
  IconSearch,
  IconSortAscendingLetters as IconSortAscending,
  IconSortDescendingLetters as IconSortDescending,
} from '@tabler/icons'
import { FC, useMemo, useRef, useState, useTransition } from 'react'
import {
  Column,
  TableInstance,
  useFilters,
  useGlobalFilter,
  useSortBy,
  useTable,
} from 'react-table'
import { capitalize, useIsMobile } from '../utils/helpers'
import { Tooltip } from './tooltip'

export interface TestColumnType {
  id: string
  result: 'pass' | 'fail' | 'error'
  suite_name: string
}

export interface TestsTableProps {
  tables: {
    suite_name: string
    data: TestColumnType[]
  }[]
  header: string
}

const useStyles = createStyles(theme => ({
  header: {
    zIndex: 200,
    position: 'sticky',
    top: 0,
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    transition: 'box-shadow 150ms ease',

    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderBottom: `1px solid ${
        theme.colorScheme === 'dark'
          ? theme.colors.dark[3]
          : theme.colors.gray[2]
      }`,
    },
  },

  scrolled: {
    boxShadow: theme.shadows.sm,
  },
}))

export const TestsTable: FC<TestsTableProps> = ({ tables, header }) => {
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
            <Tooltip>
              <div>TODO</div>
              <div>
                <i>Ex: ZG-RESISTANCE-005 (part 2)</i>
              </div>
              <div>Some additional notes</div>
            </Tooltip>
          </Group>
        ),
      },
      {
        Header: 'Result',
        accessor: 'result',
        Cell: ({ value, state }) => (
          <Text
            color={
              value === 'pass' ? 'green' : value === 'fail' ? 'red' : 'yellow'
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

  const { classes, cx } = useStyles()
  const isMobile = useIsMobile()
  const [searchValue, setSearchValue] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(
    tables[0].suite_name
  )

  const data = useMemo(
    () => tables.find(table => table.suite_name === activeTab)?.data || [],
    [activeTab, tables]
  )
  const {
    setGlobalFilter,
    getTableBodyProps,
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    { columns, data },
    useGlobalFilter,
    useFilters,
    useSortBy
  ) as TableInstance<TestColumnType> & { [index: string]: any }

  const [_, startTransition] = useTransition()
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    startTransition(() => {
      setGlobalFilter(value)
    })
  }

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLTableElement>({
    offset: 50,
    isList: true,
  })
  const [scrolled, setScrolled] = useState(false)
  const scrollToTable = () => scrollIntoView({ alignment: 'end' })

  const scrollPos = useRef({ x: 0, y: 0 })

  return (
    <Accordion defaultValue="table">
      <Accordion.Item value="table">
        <Accordion.Control py="xs" mt="xs">
          <Title size="h2">{header}</Title>
        </Accordion.Control>
        <Accordion.Panel>
          <ScrollArea
            sx={{ height: 'calc(100vh - 75px)' }}
            type="auto"
            onScrollPositionChange={({ y, x }) => {
              const scrolled = y !== 0
              if (!scrolled) setScrolled(scrolled)

              if (y - scrollPos.current.y !== 0) scrollToTable()
              scrollPos.current = { x, y }
            }}
            styles={{
              scrollbar: {
                zIndex: 201,
              },
            }}
          >
            <Tabs py="sm" value={activeTab} onTabChange={setActiveTab}>
              <Tabs.List grow>
                {tables.map(({ suite_name }) => (
                  <Tabs.Tab key={suite_name} value={suite_name}>
                    {capitalize(suite_name)}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>

            <TextInput
              mt="md"
              variant="filled"
              placeholder={`Search ${activeTab} tests`}
              icon={<IconSearch size={14} stroke={1.5} />}
              value={searchValue}
              onFocus={() => !isMobile && scrollToTable()}
              onChange={e => handleSearchChange(e.target.value)}
            />
            <Table
              ref={targetRef}
              striped
              highlightOnHover
              verticalSpacing="md"
              sx={{ minWidth: 700 }}
              {...getTableProps()}
            >
              <thead
                className={cx(classes.header, { [classes.scrolled]: scrolled })}
              >
                {headerGroups.map(headerGroup => {
                  const { key, ...headerGroupProps } =
                    headerGroup.getHeaderGroupProps()
                  return (
                    <tr key={key} {...headerGroupProps}>
                      {headerGroup.headers.map((column: any) => {
                        const { key, ...headerProps } = column.getHeaderProps(
                          column.getSortByToggleProps()
                        )
                        return (
                          <th key={key} {...headerProps}>
                            <Group spacing="xs">
                              {column.render('Header')}
                              {column.isSorted ? (
                                column.isSortedDesc ? (
                                  <IconSortDescending size={16} />
                                ) : (
                                  <IconSortAscending size={16} />
                                )
                              ) : (
                                <IconSortDescending opacity={0} size={16} /> // To prevent layout shift
                              )}
                            </Group>
                          </th>
                        )
                      })}
                    </tr>
                  )
                })}
              </thead>

              <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                  prepareRow(row)
                  const { key, ...rowProps } = row.getRowProps()
                  return (
                    <tr key={key} {...rowProps}>
                      {row.cells.map(cell => {
                        const { key, ...cellProps } = cell.getCellProps()
                        return (
                          <td key={key} {...cellProps}>
                            {cell.render('Cell')}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            <Space h="md" />
          </ScrollArea>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
