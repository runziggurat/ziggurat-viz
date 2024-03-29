import { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../../components/navbar'
import {
  CSSObject,
  Center,
  createStyles,
  Text,
  Stack,
  Title,
} from '@mantine/core'
import { NAVBAR_HEIGHT } from '../../utils/constants'
import { useEffect, useRef } from 'react'
import { useSetState } from '@mantine/hooks'
import { bg, overlay as bgOverlay, text } from '../../utils/theme'
import { useAnimationFrame } from '../../utils/animation-frame'
import { errorPanel } from '../../styles/global'
import { parseNetwork } from '../../utils/network'
import { getFileJson } from '../../utils/helpers'

import { fetchVizData, networkStaticPaths } from '../../utils/next'
import { Status, StatusCode, VizData } from '../../utils/types'
import {
  BETWEENNESS_ID,
  CITY_ID,
  CLOSENESS_ID,
  COLOR_MODE_ID,
  CONNECTIONS_ID,
  COUNTRY_ID,
  FPS_ID,
  GRADIENT_INFO_ID,
  IP_ID,
  KEYMAPS_INFO_ID,
  LATITUDE_ID,
  LONGITUDE_ID,
  NETWORK_TYPE_ID,
  NODE_INFO_ID,
  NUM_SUBNODES_ID,
  STATS_INFO_ID,
  SUBNODE_INDEX_ID,
  TIME_ID,
} from '../../viz/core'
import { useRouter } from 'next/router'

import type { CApp } from '../../viz/app'
import { FilePicker } from '../../components/file-picker'

const useStyles = createStyles(theme => {
  const overlay: CSSObject = {
    position: 'absolute',
    margin: 0,
    backgroundColor: bgOverlay(bg(theme), theme),
    padding: '5px 10px',
  }
  const overlayEdge = 5
  return {
    main: {
      color: text(theme),
      fontFamily: theme.fontFamilyMonospace,
      fontSize: theme.fontSizes.xs,
      position: 'relative',
      bottom: 0,
      display: 'flex',
      width: '100%',
      height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
    },
    canvas: {
      margin: 0,
      width: '100%',
      height: '100%',
    },
    kbd: {
      width: 32,
      height: 24,
    },
    overlayTopLeft: {
      ...overlay,
      left: overlayEdge,
      top: overlayEdge,
    },
    overlayTopRight: {
      ...overlay,
      right: overlayEdge,
      top: overlayEdge,
    },
    overlayBottomLeft: {
      ...overlay,
      left: overlayEdge,
      bottom: overlayEdge,
    },
    overlayBottomCenter: {
      ...overlay,
      bottom: '5px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    ...errorPanel(theme),
  }
})

const loadingStatus: Status = {
  message: 'loading geo location graph...',
  code: StatusCode.Loading,
}

const Geo: NextPage<{ data: VizData | null }> = ({ data }) => {
  const { classes } = useStyles()
  const router = useRouter()
  const [status, setStatus] = useSetState<Status>(loadingStatus)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<CApp>()

  const initialize = async (state: VizData['viz_state']) => {
    setStatus(loadingStatus)
    try {
      const { CApp: App } = await import('../../viz/app')
      const canvas = canvasRef.current
      if (!canvas) {
        throw new Error('canvas not found')
      }
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight - NAVBAR_HEIGHT
      if (!appRef.current) {
        appRef.current = new App(canvas, state)
        await appRef.current.initialize()
        setStatus({
          code: StatusCode.Success,
        })
      }
    } catch (err) {
      const description =
        err instanceof Error ? err.message : 'Please try again later!'
      setStatus({
        code: StatusCode.Error,
        message: 'error loading geo location graph\n' + description,
      })
    }
  }

  const destroy = () => {
    appRef.current?.destroy()
    appRef.current = undefined
  }

  useEffect(() => {
    if (!data) {
      setStatus({
        code: StatusCode.Warning,
        message: 'geo location graph is not available for the current network',
      })
      return
    }
    initialize(data.viz_state)
    return destroy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useAnimationFrame(() => {
    if (appRef.current) {
      appRef.current.render()
    }
  })
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
    const state = await getFileJson(file)
    destroy()
    initialize(state)
  }
  return (
    <Navbar metaData={data?.meta_data}>
      <FilePicker handleFile={handleFile} />
      <Head>
        <title>Ziggurat Explorer</title>
        <meta name="description" content="P2P Visualizer: Geo Location" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style jsx global>{`
        body {
          overflow: hidden;
        }
      `}</style>
      {status.code !== StatusCode.Success ? (
        <Center className={classes.status}>
          <Text
            sx={theme => ({
              color:
                status.code === StatusCode.Error
                  ? text(theme, { variant: 'error' })
                  : status.code === StatusCode.Warning
                  ? text(theme, { variant: 'warning' })
                  : text(theme),
            })}
            className={classes.statusText}
          >
            {status.message}
          </Text>
        </Center>
      ) : null}
      <Center
        style={{
          display: status.code !== StatusCode.Success ? 'none' : undefined,
        }}
        className={classes.main}
      >
        <canvas className={classes.canvas} ref={canvasRef} />
        <div className={classes.overlayTopLeft} id={STATS_INFO_ID}>
          <div>
            time: <span id={TIME_ID}></span>
          </div>
          <div>
            FPS: <span id={FPS_ID}></span>
          </div>
          <div>
            color: <span id={COLOR_MODE_ID}></span>
          </div>
        </div>
        <div className={classes.overlayTopRight} id={NODE_INFO_ID}>
          <div>
            <span id={IP_ID} />
          </div>
          <div>
            network type: <span id={NETWORK_TYPE_ID} />
          </div>
          <div>
            betweenness: <span id={BETWEENNESS_ID} />
          </div>
          <div>
            closeness: <span id={CLOSENESS_ID} />
          </div>
          <div>
            connections: <span id={CONNECTIONS_ID} />
          </div>
          <div>
            latitude: <span id={LATITUDE_ID} />
          </div>
          <div>
            longitude: <span id={LONGITUDE_ID} />
          </div>
          <div>
            subnode index: <span id={SUBNODE_INDEX_ID} />
          </div>
          <div>
            number of subnodes: <span id={NUM_SUBNODES_ID} />
          </div>
          <div>
            city: <span id={CITY_ID}></span>
          </div>
          <div>
            country: <span id={COUNTRY_ID}></span>
          </div>
        </div>
        <div className={classes.overlayBottomLeft} id={KEYMAPS_INFO_ID}>
          <Stack spacing={0}>
            <Title order={6}>Keyboard Commands</Title>
            <div>arrow keys: move left, right, up and down</div>
            <div>i: zoom in</div>
            <div>o: zoom out</div>
            <div>c: cycle color mode</div>
            <div>f: toggle FPS display</div>
            <div>g: toggle gradient display</div>
            <div>h: toggle histogram display</div>
            <div>n: toggle all-connections display</div>
            <div>x: toggle keymaps display</div>
          </Stack>
        </div>
        <div className={classes.overlayBottomCenter} id={GRADIENT_INFO_ID} />
      </Center>
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

export default Geo
