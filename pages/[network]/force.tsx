import { GetStaticProps, NextPage } from 'next'
import { Navbar } from '../../components/navbar'
import { useEffect } from 'react'
import { Center, createStyles, Text } from '@mantine/core'
import { useSetState } from '@mantine/hooks'
import { errorPanel } from '../../styles/global'
import Head from 'next/head'
import { fetchVizData, networkStaticPaths } from '../../utils/next'
import { parseNetwork } from '../../utils/network'
import { Status, StatusCode, VizData } from '../../utils/types'

const useStyles = createStyles(theme => ({
  ...errorPanel(theme),
}))

let destroy: any

const Force: NextPage<{ data: VizData | null }> = ({ data }) => {
  const { classes } = useStyles()
  const [status, setStatus] = useSetState<Status>({
    message: 'loading force graph...',
    code: StatusCode.Loading,
  })
  useEffect(() => {
    if (!data) {
      setStatus({
        code: StatusCode.Warning,
        message: 'force graph is not available for the current network',
      })
      return
    }
    import('../../viz/force')
      .then(({ renderForceGraph, destroyForceGraph }) => {
        renderForceGraph(data.viz_state)
        destroy = destroyForceGraph
        setStatus({
          code: StatusCode.Success,
        })
      })
      .catch(err => {
        setStatus({
          code: StatusCode.Error,
          message:
            'error loading force graph\n' +
            (err?.message || 'Please try again later!'),
        })
      })
    return () => {
      destroy?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Navbar metaData={data?.meta_data}>
      <Head>
        <title>Ziggurat Explorer</title>
        <meta name="description" content="P2P Visualizer: Force Graph" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {status.code !== StatusCode.Success && (
        <Center className={classes.status}>
          <Text
            color={
              status.code === StatusCode.Error
                ? 'red !important'
                : status.code === StatusCode.Warning
                ? 'yellow !important'
                : undefined
            }
            className={classes.statusText}
          >
            {status.message}
          </Text>
        </Center>
      )}
      <div id="graph" style={{ position: 'absolute', bottom: 0 }} />
    </Navbar>
  )
}

export const getStaticPaths = networkStaticPaths

export const getStaticProps: GetStaticProps<{
  data: VizData | null
}> = async context => {
  const network = parseNetwork(context.params)
  if (!network) {
    return {
      notFound: true,
    }
  }

  const data = await fetchVizData(network)
  return {
    props: {
      data,
    },
    // Refresh every day
    revalidate: 24 * 60 * 60,
  }
}

export default Force
