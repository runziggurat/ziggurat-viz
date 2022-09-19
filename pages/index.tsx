import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>GUI</title>
        <meta name="description" content="TODO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      Ziggurat rocks
    </div>
  );
};

export default Home;
