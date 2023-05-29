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
import { CApp } from '../../viz/app'
import { useAnimationFrame } from '../../utils/animation-frame'
import { errorPanel } from '../../styles/global'
import { parseNetwork } from '../../utils/network'

import {
  fetchVizData,
  networkStaticPaths,
} from '../../utils/next'
import { Status, StatusCode, VizData } from '../../utils/types'

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
      position: 'absolute',
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

const Geo: NextPage<{ data: VizData | null }> = ({ data }) => {
  const { classes } = useStyles()
  const [status, setStatus] = useSetState<Status>({
    message: 'loading geo location graph...',
    code: StatusCode.Loading,
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<CApp>()
  useEffect(() => {
    if (!data) {
      setStatus({
        code: StatusCode.Warning,
        message: 'geo location graph is not available for the current network',
      })
    }
    import('../../viz/app')
      .then(({ CApp }) => {
        if (!canvasRef.current) {
          throw new Error('canvas not found')
        }
        if (!appRef.current && data) {
          appRef.current = new CApp(canvasRef.current)
          appRef.current.start(data.viz_state).then(() => {
            setStatus({
              code: StatusCode.Success,
            })
          })
        }
      })
      .catch(err => {
        setStatus({
          code: StatusCode.Error,
          message:
            'error loading geo location graph\n' +
            (err?.message || 'Please try again later!'),
        })
      })
    return () => {
      if (appRef.current) {
        appRef.current.destroy()
        appRef.current = undefined
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useAnimationFrame(() => {
    if (appRef.current) {
      appRef.current.render()
    }
  })
  return (
    <Navbar metaData={data?.meta_data}>
      <Head>
        <title>Ziggurat Explorer</title>
        <meta name="description" content="P2P Visualizer: Geo Location" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
        <canvas className={classes.canvas} ref={canvasRef}></canvas>
        <div className={classes.overlayTopLeft} id="overlayLeft">
          <div>
            time: <span id="time"></span>
          </div>
          <div>
            FPS: <span id="fps"></span>
          </div>
          <div>
            color: <span id="colormode"></span>
          </div>
        </div>
        <div className={classes.overlayTopRight} id="overlayRight">
          <div>
            <span id="ip" />
          </div>
          <div>
            network type: <span id="networktype" />
          </div>
          <div>
            betweenness: <span id="betweenness" />
          </div>
          <div>
            closeness: <span id="closeness" />
          </div>
          <div>
            connections: <span id="connections" />
          </div>
          <div>
            latitude: <span id="latitude" />
          </div>
          <div>
            longitude: <span id="longitude" />
          </div>
          <div>
            subnode index: <span id="subnode" />
          </div>
          <div>
            number of subnodes: <span id="numsubnodes" />
          </div>
          <div>
            city: <span id="city"></span>
          </div>
          <div>
            country: <span id="country"></span>
          </div>
        </div>
        <div className={classes.overlayBottomLeft} id="instructions">
          <Stack spacing={0}>
            <Title order={6}>Keyboard Commands</Title>
            <div>arrow keys: move left, right, up, down</div>
            <div>i: zoom in</div>
            <div>o: zoom out</div>
            <div>c: cycle color mode</div>
            <div>f: toggle FPS display</div>
            <div>g: toggle gradient display</div>
            <div>h: toggle histogram display</div>
            <div>n: toggle connections display</div>
            <div>x: toggle command overlay</div>
          </Stack>
        </div>
        <div className={classes.overlayBottomCenter} id="gradient" />
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
