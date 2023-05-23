import { GetStaticProps, NextPage } from 'next'
import { Navbar } from '../../components/navbar'
import { useEffect } from 'react'
import { Center, createStyles, Text } from '@mantine/core'
import { useSetState } from '@mantine/hooks'
import WEBGL from 'three/examples/jsm/capabilities/WebGL'
import { errorPanel } from '../../styles/global'
import Head from 'next/head'
import { VizData, fetchVizData, networkStaticPaths } from '../../utils/next'
import { parseNetwork } from '../../utils/network'

const useStyles = createStyles(theme => ({
  ...errorPanel(theme),
}))

let destroy: any

const Force: NextPage<{ data: VizData }> = ({ data }) => {
  console.log({ force: data })
  const { classes } = useStyles()
  const [status, setStatus] = useSetState({
    msg: 'loading force graph...',
    error: false,
    done: false,
  })
  useEffect(() => {
    import('../../viz/force')
      .then(({ loadFilteredDemo, destroy: _destroy }) => {
        // Early detect as we can't catch force error's here.
        if (!WEBGL.isWebGL2Available()) {
          throw new Error(WEBGL.getWebGL2ErrorMessage().textContent || '')
        }
        destroy = _destroy
        setStatus({
          done: true,
        })
        return loadFilteredDemo()
      })
      .catch(err => {
        setStatus({
          error: true,
          msg:
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
    <Navbar>
      <Head>
        <title>Ziggurat Explorer</title>
        <meta name="description" content="P2P Visualizer: Force Graph" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!status.done && (
        <Center className={classes.status}>
          <Text
            color={status.error ? 'red !important' : undefined}
            className={classes.statusText}
          >
            {status.msg}
          </Text>
        </Center>
      )}
      <div id="graph" style={{ position: 'absolute', bottom: 0 }} />
    </Navbar>
  )
}

export const getStaticPaths = networkStaticPaths

export const getStaticProps: GetStaticProps<{ data: {} }> = async context => {
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
