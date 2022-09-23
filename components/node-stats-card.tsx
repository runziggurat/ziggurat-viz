import { createStyles, Paper, RingProgress, Stack, Text } from '@mantine/core'
import { FC } from 'react'

const useStatStyles = createStyles(theme => ({
  container: {
    maxWidth: 400,
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

  inner: {
    display: 'flex',

    [theme.fn.smallerThan(350)]: {
      flexDirection: 'column',
    },
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
  const stats = [
    { value: total, label: 'Known nodes' },
    {
      value: connections,
      label: 'Known connections',
    },
  ]
  const title = 'Nodes'

  const items = stats.map(stat => (
    <div key={stat.label}>
      <Text size="sm" className={classes.label}>
        {stat.value}
      </Text>
      <Text size="xs" color="dimmed">
        {stat.label}
      </Text>
    </div>
  ))

  return (
    <Stack spacing={0} className={classes.container}>
      <Paper withBorder py="md" px="lg" radius="md">
        <div className={classes.inner}>
          <div>
            <Text size="md" className={classes.label}>
              {title}
            </Text>
            <div>
              <Text size="xl" className={classes.lead} mt="lg">
                {good}
              </Text>
              <Text size="xs" color="dimmed">
                Good nodes
              </Text>
            </div>
            <Stack mt="md">{items}</Stack>
          </div>

          <div className={classes.ring}>
            <RingProgress
              roundCaps
              thickness={10}
              size={175}
              sections={[
                { value: (good / total) * 100, color: theme.primaryColor },
              ]}
              label={
                <div>
                  <Text
                    align="center"
                    size="lg"
                    className={classes.label}
                    sx={{ fontSize: 22 }}
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
        </div>
      </Paper>
      <Text size="xs" color="dimmed" align="end" mt={2}>
        Crawler ran for the total of {props.crawler_runtime.secs} seconds.
      </Text>
    </Stack>
  )
}
