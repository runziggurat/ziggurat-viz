import { Code, ScrollArea, Title } from '@mantine/core'
import { FC } from 'react'

interface Props {
  data: any
  title: string
}

export const CrawlerCard: FC<Props> = ({ data, title }) => {
  return (
    <>
      <Title my="lg" order={2}>
        {title}
      </Title>
      <ScrollArea style={{ height: 250 }} scrollHideDelay={500}>
        <Code block>{JSON.stringify(data, null, 2)}</Code>
      </ScrollArea>
    </>
  )
}
