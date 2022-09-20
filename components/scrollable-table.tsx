import { FC, ReactNode, useState } from 'react'
import { createStyles, Table, ScrollArea } from '@mantine/core'
import { TableInstance } from 'react-table'

const useStyles = createStyles(theme => ({
  header: {
    zIndex: 1000,
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

interface Props {
  height?: number | string
  tableInst: TableInstance<any>
}

export const ScrollableTable: FC<Props> = ({ height = 500, tableInst }) => {
  const { classes, cx } = useStyles()
  const [scrolled, setScrolled] = useState(false)

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInst

  return (
    <ScrollArea
      sx={{ height }}
      type="auto"
      onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
    >
      <Table
        striped
        highlightOnHover
        verticalSpacing="md"
        sx={{ minWidth: 700 }}
        {...getTableProps()}
      >
        <thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
          {headerGroups.map(headerGroup => {
            const { key, ...headerGroupProps } =
              headerGroup.getHeaderGroupProps()
            return (
              <tr key={key} {...headerGroupProps}>
                {headerGroup.headers.map(column => {
                  const { key, ...headerProps } = column.getHeaderProps()
                  return (
                    <th key={key} {...headerProps}>
                      {column.render('Header')}
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
    </ScrollArea>
  )
}
