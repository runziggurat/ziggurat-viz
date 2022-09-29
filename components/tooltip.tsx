import { ActionIcon } from '@mantine/core'
import { IconQuestionMark } from '@tabler/icons'
import { FC } from 'react'
import { HoverCard } from './hover-card'

interface Props {
  children: React.ReactNode
}

export const Tooltip: FC<Props> = ({ children }) => {
  return (
    <HoverCard
      target={
        <ActionIcon size="xs" variant="filled" color="dark" radius="xl">
          <IconQuestionMark size={12} />
        </ActionIcon>
      }
    >
      {children}
    </HoverCard>
  )
}
