import '../styles/noble/style.min.css'
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import '../styles/noble/globals.css'
import { ToastContainer } from "react-toastify"
import Head from "next/head";
import { useEffect } from 'react';
import { get_theme, set_theme } from '../config/config';
import { useState } from 'react';
import classNames from 'classnames';
import ThemeContext from "../store/theme_context"

function MyApp({ Component, pageProps }) {

  return (
    <>
      <Head>
        <title>Data Timbang</title>
      </Head>
      
      <Component {...pageProps} />

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop={false}
        closeButton={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
        limit={1}
      />
    </>
  )
}

export default MyApp
