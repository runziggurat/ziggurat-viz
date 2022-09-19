import { Center, Container } from '@mantine/core'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>GUI</title>
        <meta name="description" content="TODO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Center>Ziggurat rocks</Center>
      </Container>
    </div>
  )
}

export default Home
