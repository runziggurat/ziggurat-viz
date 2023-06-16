import { MantineTheme, CSSObject } from '@mantine/core'
import { Global } from '@mantine/styles'
import { NAVBAR_HEIGHT } from '../utils/constants'
import { text } from '../utils/theme'

type Styles = Parameters<typeof Global>['0']['styles']

export const globalStyles: Styles = (theme: MantineTheme) => ({
  html: {
    height: '100%',
  },
  body: {
    position: 'relative',
    height: '100%',
  },
})

export const errorPanel = (
  theme: MantineTheme
): Record<'status' | 'statusText', CSSObject> => ({
  status: {
    height: `calc(100% - ${NAVBAR_HEIGHT}px)`,
    width: '100vw',
    position: 'fixed',
    bottom: 0,
    zIndex: 250,
  },
  statusText: {
    color: `${text(theme)}`,
    whiteSpace: 'pre-line',
    userSelect: 'none',
    textAlign: 'center',
  },
})
