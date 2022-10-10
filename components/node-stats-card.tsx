import {
  createStyles,
  Group,
  Paper,
  RingProgress,
  Stack,
  Text,
} from '@mantine/core'
import { FC } from 'react'
import { Tooltip } from './tooltip'

const useStatStyles = createStyles(theme => ({
  container: {
    maxWidth: 350,
    width: '100%',
  },
  card: {
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
  },

  label: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontWeight: 700,
    lineHeight: 1,
  },

  lead: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontWeight: 700,
    lineHeight: 1,
  },

  ring: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',

    [theme.fn.smallerThan(350)]: {
      justifyContent: 'center',
      marginTop: theme.spacing.md,
    },
  },
}))

export const NodeStatsCard: FC<any> = props => {
  const { classes, theme } = useStatStyles()

  const good = props.num_good_nodes as number
  const total = props.num_known_nodes as number
  const connections = props.num_known_connections as number
  const versions = props.num_versions as number
  const stats = [
    { value: total, label: 'Known nodes' },
    {
      value: connections,
      label: 'Known connections',
    },
    {
      value: versions,
      label: 'Known versions',
    },
  ] as const
  const title = 'Nodes'

  const items = stats.map(stat => (
    <div key={stat.label}>
      <Text size="xs" className={classes.label}>
        {stat.value}
      </Text>
      <Text size="xs" color="dimmed">
        {stat.label}
      </Text>
    </div>
  ))

  return (
    <Stack justify="space-between" spacing={0} className={classes.container}>
      <Paper withBorder py="md" px="lg" radius="md">
        <Stack spacing={0}>
          <Text size="md" className={classes.label}>
            {title}
          </Text>
          <Group noWrap>
            <Stack spacing="xs">
              <div>
                <Text size="md" className={classes.lead} mt="lg">
                  {good}
                </Text>
                <Group noWrap spacing="xs">
                  <Text size="xs" color="dimmed" sx={{ whiteSpace: 'nowrap' }}>
                    Good nodes
                  </Text>
                  <Tooltip>
                    <div>TODO</div>
                    <div>
                      <i>Ex: Crawler reachable</i>
                    </div>
                    <div>Some additional description</div>
                  </Tooltip>
                </Group>
              </div>
              {items[0]}
            </Stack>

            <div className={classes.ring}>
              <RingProgress
                ml="sm"
                roundCaps
                thickness={10}
                size={125}
                sections={[
                  { value: (good / total) * 100, color: theme.primaryColor },
                ]}
                label={
                  <div>
                    <Text
                      align="center"
                      size="lg"
                      className={classes.label}
                      sx={{ fontSize: 16 }}
                    >
                      {((good / total) * 100).toFixed(0)}%
                    </Text>
                    <Text align="center" size="xs" color="dimmed">
                      Good
                    </Text>
                  </div>
                }
              />
            </div>
          </Group>
          <Group mt="sm" noWrap>
            {items.slice(1)}
          </Group>
        </Stack>
      </Paper>
      <Text size="xs" color="dimmed" align="end" mt={5}>
        Crawler ran for the total of {props.crawler_runtime.secs} seconds.
      </Text>
    </Stack>
  )
}
