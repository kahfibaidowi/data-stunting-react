
import '../styles/animate.css'
import "../styles/tabler.min.css"
import "../styles/styles.css"
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css'
import { ToastContainer } from "react-toastify"
import Head from "next/head";
import { useEffect } from 'react';
import { get_theme, set_theme } from '../config/config';
import { useState } from 'react';
import classNames from 'classnames';
import ThemeContext from "../store/theme_context"

function MyApp({ Component, pageProps }) {
  const [theme, setTheme]=useState("light")

  useEffect(()=>{
    let theme=get_theme()
    setTheme(theme)
    let classRemove, classAdd

    if(theme=="dark"){
      classRemove="theme-light"
      classAdd="theme-dark"
    }
    else{
      classRemove="theme-dark"
      classAdd="theme-light"
    }

    window.document.body.classList.remove(classRemove)
    window.document.body.classList.add(classAdd)
  }, [])

  const setDarkMode=()=>{
    set_theme("dark")
    setTheme("dark")
    
    window.document.body.classList.remove("theme-light")
    window.document.body.classList.add("theme-dark")
  }
  const setLightMode=()=>{
    set_theme("light")
    setTheme("light")

    window.document.body.classList.remove("theme-dark")
    window.document.body.classList.add("theme-light")
  }

  return (
    <>
      <Head>
        <title>Data Stunting</title>
      </Head>
      
      <ThemeContext.Provider 
        value={{
          setDarkMode:()=>setDarkMode(),
          setLightMode:()=>setLightMode(),
          theme:theme
        }}
      >
        <Component {...pageProps} />
      </ThemeContext.Provider>

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
