import { AppProps } from 'next/app'
import Head from 'next/head'
import {
  ColorScheme,
  MantineProvider,
  ColorSchemeProvider,
  Global,
} from '@mantine/core'
import { getCookie, setCookie } from 'cookies-next'
import { GetServerSidePropsContext } from 'next'
import { useCallback, useState } from 'react'

import { globalStyles } from '../styles/global'
import { COLOR_SCHEME_COOKIE, DEFAULT_COLOR_SCHEME } from '../utils/consants'

export default function App(props: AppProps & { colorScheme: ColorScheme }) {
  const { Component, pageProps } = props
  const [colorScheme, setColorScheme] = useState<ColorScheme>(props.colorScheme)

  const toggleColorScheme = useCallback(
    (value?: ColorScheme) => {
      const nextColorScheme =
        value || (colorScheme === 'dark' ? 'light' : 'dark')
      setColorScheme(nextColorScheme)
      // when color scheme is updated save it to cookie
      setCookie(COLOR_SCHEME_COOKIE, nextColorScheme, {
        maxAge: 60 * 60 * 24 * 30,
      })
    },
    [colorScheme]
  )

  return (
    <>
      <Head>
        <title>Page title</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>

      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          withCSSVariables
          withGlobalStyles
          withNormalizeCSS
          theme={{
            /** Put your mantine theme override here */
            colorScheme,
          }}
        >
          <Global styles={globalStyles} />
          <Component {...pageProps} />
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  )
}

App.getInitialProps = async ({ ctx }: { ctx: GetServerSidePropsContext }) => ({
  // get color scheme from cookie
  colorScheme: getCookie(COLOR_SCHEME_COOKIE, ctx) || DEFAULT_COLOR_SCHEME,
})
