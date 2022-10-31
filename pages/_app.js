
import "../styles/bootstrap.css"
import '../styles/animate.css'
import 'react-toastify/dist/ReactToastify.css';
import "../styles/import.css"
import "../styles/styles.css"
import { ToastContainer } from "react-toastify"
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Data Stunting</title>
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
      />
    </>
  )
}

export default MyApp
