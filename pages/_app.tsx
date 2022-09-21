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
import { useCallback, useEffect, useState } from 'react'
import { globalStyles } from '../styles/global'

const DEFAULT_COLOR_SCHEME: ColorScheme = 'dark'

export default function App(props: AppProps & { colorScheme: ColorScheme }) {
  const { Component, pageProps } = props
  const [colorScheme, setColorScheme] = useState<ColorScheme>(props.colorScheme)

  const toggleColorScheme = useCallback(
    (value?: ColorScheme) => {
      const nextColorScheme =
        value || (colorScheme === 'dark' ? 'light' : 'dark')
      setColorScheme(nextColorScheme)
      // when color scheme is updated save it to cookie
      setCookie('mantine-color-scheme', nextColorScheme, {
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
  colorScheme: getCookie('mantine-color-scheme', ctx) || DEFAULT_COLOR_SCHEME,
})
