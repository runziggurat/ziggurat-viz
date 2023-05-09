import { NextPage } from 'next'
import { Navbar } from '../../components/navbar'
import { useEffect } from 'react'
import { Center, createStyles, Text } from '@mantine/core'
import { text } from '../../utils/theme'
import { useSetState } from '@mantine/hooks'

const useStyles = createStyles(theme => ({
  status: {
    height: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    zIndex: 1000,
  },
  statusText: {
    color: `${text(theme)}`,
    userSelect: 'none',
  },
}))

const Force: NextPage<{}> = () => {
  const { classes } = useStyles()
  const [status, setStatus] = useSetState({
    msg: 'loading force graph...',
    error: false,
    done: false,
  })
  useEffect(() => {
    import('../../viz/force')
      .then(({ loadFilteredDemo }) => {
        setStatus({
          done: true,
        })
        return loadFilteredDemo()
      })
      .catch(() => {
        setStatus({
          error: true,
          msg: 'error loading force graph, try again later!',
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Navbar>
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

export default Force
