import {
  ScrollArea,
  Title,
  createStyles,
  Stack,
  useMantineTheme,
  Accordion,
} from '@mantine/core'
import { FC } from 'react'
import { Bubble } from 'react-chartjs-2'
import 'chart.js/auto'
import { NodeStatsCard } from './node-stats-card'

interface Props {
  data: any
  title: string
}

const useStyles = createStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    [theme.fn.smallerThan(600)]: {
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      flexDirection: 'column',
    },
  },
  canvas: {
    minHeight: 285,
  },
  stats: {
    alignSelf: 'end',
    [theme.fn.smallerThan(600)]: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
  },
}))

const normalizeBubbleVal = (val: number, num: number = 10) => {
  const a = 1.5 // How much are smaller values enlarged
  const b = 14 // How much are overall values enlarged
  const c = Math.log(num) // How much does total number affects all values
  return (Math.log(val + a) * b) / (1 + c)
}

export const CrawlerCard: FC<Props> = ({ data, title }) => {
  const { colors, colorScheme } = useMantineTheme()
  const { classes } = useStyles()

  const protocolsVersions = Object.entries(data.protocol_versions).map(
    ([k, v]) => ({
      value: v as number,
      label: k,
    })
  )
  const userAgents = Object.entries(data.user_agents).map(([k, v]) => ({
    value: v as number,
    label: k.replace(/\//g, ''),
  }))

  const blue = colorScheme == 'light' ? colors.blue[4] : colors.blue[9]
  const orange = colorScheme == 'light' ? colors.orange[4] : colors.orange[9]
  const gray = colorScheme == 'light' ? colors.gray[8] : colors.gray[5]

  const grayT = colorScheme == 'light' ? colors.gray[3] : colors.gray[7]
  const blueT = colors.blue[2]
  const orangeT = colors.orange[2]

  const gridOptions = {
    grid: {
      color: grayT,
    },
  }

  return (
    <Accordion
      defaultValue="crawler"
      styles={{ content: { paddingRight: 0, paddingLeft: 0 } }}
    >
      <Accordion.Item value="crawler">
        <Accordion.Control py="xs" mt="xs">
          <Title size="h2">{title}</Title>
        </Accordion.Control>
        <Accordion.Panel sx={{ wordBreak: 'normal' }}>
          <div className={classes.container}>
            <ScrollArea
              type="auto"
              style={{ width: '100%' }}
              scrollHideDelay={500}
            >
              <Stack style={{ flexGrow: 1 }}>
                <Bubble
                  className={classes.canvas}
                  height={135}
                  options={{
                    responsive: true,
                    scales: {
                      xtop: {
                        ...gridOptions,
                        position: 'top',
                        ticks: {
                          stepSize: 1,
                          color: gray,
                          font: {
                            size: 10,
                          },
                          callback(_, index) {
                            const { label } = userAgents[index]
                            return label
                          },
                        },
                      },
                      xbottom: {
                        ...gridOptions,
                        ticks: {
                          color: gray,
                          stepSize: 1,
                          callback(_, index) {
                            const { label } = protocolsVersions[index]
                            return 'v' + label
                          },
                        },
                      },
                      y: {
                        ...gridOptions,
                        max: 4,
                        min: 0,
                        ticks: { display: false },
                      },
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: ctx => (ctx.raw as any).label,
                        },
                      },
                    },
                  }}
                  data={{
                    datasets: [
                      {
                        label: 'Protocol versions',
                        xAxisID: 'xbottom',
                        data: protocolsVersions.map(
                          ({ value, label }, idx) => ({
                            x: idx,
                            y: 1,
                            r: normalizeBubbleVal(
                              value,
                              Math.max(
                                protocolsVersions.length,
                                userAgents.length
                              )
                            ),
                            label: `Protocol version ${label} (${value})`,
                          })
                        ),
                        borderColor: blue,
                        backgroundColor: blueT,
                      },
                      {
                        label: 'User agents',
                        xAxisID: 'xtop',
                        data: userAgents.map(({ value, label }, idx) => ({
                          x: idx,
                          y: 3,
                          r: normalizeBubbleVal(
                            value,
                            Math.max(
                              protocolsVersions.length,
                              userAgents.length
                            )
                          ),
                          label: `User agent ${label} (${value})`,
                        })),
                        borderColor: orange,
                        backgroundColor: orangeT,
                      } as any,
                    ],
                  }}
                />
              </Stack>
            </ScrollArea>
            <div className={classes.stats}>
              <NodeStatsCard {...data} />
            </div>
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
