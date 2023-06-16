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
import { COLOR_SCHEME_COOKIE, DEFAULT_COLOR_SCHEME } from '../utils/constants'
import { ModalsProvider } from '@mantine/modals'
import { useRouter } from 'next/router'

export default function App(props: AppProps & { colorScheme: ColorScheme }) {
  const router = useRouter()
  const { Component, pageProps } = props
  const [colorScheme, setColorScheme] = useState<ColorScheme>(props.colorScheme)

  useEffect(() => {
    window.document.documentElement.setAttribute(
      'data-color-scheme',
      colorScheme
    )
    window.dispatchEvent(new Event('color-scheme-change'))
  }, [colorScheme])

  useEffect(() => {
    const routeQueries = ['network']
    const queries = Object.fromEntries(
      Object.entries(router.query).filter(([key]) => routeQueries.includes(key))
    )
    router.replace({ pathname: router.pathname, query: queries })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            colorScheme,
          }}
        >
          <ModalsProvider>
            <Global styles={globalStyles} />
            <Component {...pageProps} />
          </ModalsProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  )
}

App.getInitialProps = async ({ ctx }: { ctx: GetServerSidePropsContext }) => ({
  // get color scheme from cookie
  colorScheme: getCookie(COLOR_SCHEME_COOKIE, ctx) || DEFAULT_COLOR_SCHEME,
})
