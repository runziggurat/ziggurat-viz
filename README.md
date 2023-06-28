<h1 align="center"> Ziggurat Visualizations</h1> 

<p align="center">
<a href="https://app.runziggurat.com">
<img src="./public/logo.png" height="300px">
</a>
</p>
<p align="center">Visualizations module of the Ziggurat project.</p>

<p align="center">
<img src="https://github.com/runziggurat/zcash/actions/workflows/zcashd-nightly.yml/badge.svg" alt="zcashd"/>
<img src="https://github.com/runziggurat/zcash/actions/workflows/zebra.yml/badge.svg" alt="zebra" />
<img src="https://github.com/runziggurat/xrpl/actions/workflows/rippled.yml/badge.svg" alt="rippled" />
<img src="https://github.com/runziggurat/zcash/actions/workflows/crawler.yml/badge.svg" alt="zcash crawler" />
<img src="https://github.com/runziggurat/xrpl/actions/workflows/crawler.yml/badge.svg" alt="xrpl crawler" />
</p>

This repository contains the source code for the visualizations of the Ziggurat project. These visualizations include Ziggurat test results, WebGL-based force and geo graphs, and crawler report visualizations.

Currently, the following network visualizations are available. Please refer to the respective repositories for more information. 

- [zcashd](https://github.com/runziggurat/zcash)
- [Zebra](https://github.com/runziggurat/zcash)
- [Xrpl](https://github.com/runziggurat/xrpl)

## Contributing

Contributions are welcome. Open an issue for any query or suggestion and we will take it from there. For more information, please refer to the [contribution guidelines](https://github.com/runziggurat/.github/blob/main/CONTRIBUTING.md) of the Ziggurat project.

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Getting Started

First, install dependencies:

```bash
yarn
```

> Note: We recommend using yarn v1 for consistency.

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing any page in `pages/` directory. The page auto-updates as you edit the file.

> Note: Data fetching methods like `getStaticProps` are run each time a page is refreshed in development mode. So pages may feel slow. This is not the case in production mode.

### Build

To build the app for production, run:

```bash
yarn build
```

This can be used to simulate production environment. Use the following command to start the app in production mode after building:

```bash
yarn start
```

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
