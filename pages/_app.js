import React from 'react';
import ReactDOM from 'react-dom';
import App from 'next/app';
import Head from 'next/head';
import Router from 'next/router';

import PageChange from 'components/PageChange/PageChange.js';

import '@fortawesome/fontawesome-free/css/all.min.css';
import 'styles/tailwind.css';

Router.events.on('routeChangeStart', (url) => {
  console.log(`Loading: ${url}`);
  document.body.classList.add('body-page-transition');
  ReactDOM.render(
    <PageChange path={url} />,
    document.getElementById('page-transition')
  );
});
Router.events.on('routeChangeComplete', () => {
  ReactDOM.unmountComponentAtNode(document.getElementById('page-transition'));
  document.body.classList.remove('body-page-transition');
});
Router.events.on('routeChangeError', () => {
  ReactDOM.unmountComponentAtNode(document.getElementById('page-transition'));
  document.body.classList.remove('body-page-transition');
});

export default class MyApp extends App {
  componentDidMount() {
    let comment = document.createComment(`歡迎來到 Alan 與 Ariel 的婚禮派對`);
    document.insertBefore(comment, document.documentElement);
  }
  static async getInitialProps({ Component, router, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    return { pageProps };
  }
  render() {
    const { Component, pageProps } = this.props;

    const Layout = Component.layout || (({ children }) => <>{children}</>);

    return (
      <React.Fragment>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />
          <title>歡迎來到 Alan 與 Ariel 的婚禮派對</title>
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </React.Fragment>
    );
  }
}
