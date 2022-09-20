import { HoverCard as HoverCardPrim, Button, Text, Group } from '@mantine/core'
import { FC } from 'react'

interface Props {
  children: React.ReactNode
  target: React.ReactNode
}

export const HoverCard: FC<Props> = ({ children, target }) => {
  return (
    <Group position="center">
      <HoverCardPrim position="top" width={280} shadow="md">
        <HoverCardPrim.Target>{target}</HoverCardPrim.Target>
        <HoverCardPrim.Dropdown>{children}</HoverCardPrim.Dropdown>
      </HoverCardPrim>
    </Group>
  )
}
