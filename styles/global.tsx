import { MantineTheme } from '@mantine/core'
import { Global } from '@mantine/styles'

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
