import { GetStaticProps, NextPage } from 'next'
import { Navbar } from '../../components/navbar'
import { useEffect, useRef } from 'react'
import { Center, createStyles, Text } from '@mantine/core'
import { useSetState } from '@mantine/hooks'
import { errorPanel } from '../../styles/global'
import Head from 'next/head'
import { fetchVizData, networkStaticPaths } from '../../utils/next'
import { parseNetwork } from '../../utils/network'
import { Status, StatusCode, VizData } from '../../utils/types'
import { text } from '../../utils/theme'
import { FilePicker } from '../../components/file-picker'
import { getFileJson } from '../../utils/helpers'
import { useRouter } from 'next/router'

const useStyles = createStyles(theme => ({
  ...errorPanel(theme),
}))

const loadingStatus: Status = {
  message: 'loading force graph...',
  code: StatusCode.Loading,
}

const Force: NextPage<{ data: VizData | null }> = ({ data }) => {
  const { classes } = useStyles()
  const router = useRouter()
  const [status, setStatus] = useSetState<Status>(loadingStatus)

  const destroyRef = useRef<() => void>()
  const graphRef = useRef<HTMLDivElement>(null)

  const initialize = async (state: VizData['viz_state']) => {
    setStatus(loadingStatus)
    try {
      const { renderForceGraph, destroyForceGraph } = await import(
        '../../viz/force'
      )
      if (!destroyRef.current) {
        destroyRef.current = destroyForceGraph
        renderForceGraph(state)

        requestAnimationFrame(() => {
          setStatus({
            code: StatusCode.Success,
          })
        })
      }
    } catch (err) {
      const description =
        err instanceof Error ? err.message : 'Please try again later!'
      setStatus({
        code: StatusCode.Error,
        message: 'error loading force graph\n' + description,
      })
    }
  }

  const destroy = () => {
    if (graphRef.current) {
      graphRef.current.innerHTML = ''
    }
    destroyRef.current?.()
    destroyRef.current = undefined
  }

  useEffect(() => {
    if (!data) {
      setStatus({
        code: StatusCode.Warning,
        message: 'force graph is not available for the current network',
      })
      return
    }
    initialize(data.viz_state)
    return destroy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFile = async (file: File) => {
    router.push(
      {
        query: {
          ...router.query,
          file: file.name,
        },
      },
      undefined,
      {
        shallow: true,
      }
    )
    setStatus(loadingStatus)
    const state = await getFileJson(file)
    destroy()
    initialize(state)
  }
  return (
    <Navbar metaData={data?.meta_data}>
      <FilePicker handleFile={handleFile} />
      <Head>
        <title>Ziggurat Explorer</title>
        <meta name="description" content="P2P Visualizer: Force Graph" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {status.code !== StatusCode.Success && (
        <Center className={classes.status}>
          <Text
            className={classes.statusText}
            sx={theme => ({
              color:
                status.code === StatusCode.Error
                  ? text(theme, { variant: 'error' })
                  : status.code === StatusCode.Warning
                  ? text(theme, { variant: 'warning' })
                  : text(theme),
            })}
          >
            {status.message}
          </Text>
        </Center>
      )}
      <div
        ref={graphRef}
        id="graph"
        style={{ position: 'absolute', bottom: 0 }}
      />
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
