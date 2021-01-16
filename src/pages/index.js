import React from "react"
import { Helmet } from "react-helmet"

import { ChakraProvider } from '@chakra-ui/react'
// import Handsign from "./handsign"

import Zeye from "../pages/zeye"
import Eye from '../pages/eye'

const IndexPage = () => (
  <ChakraProvider id="chakra-provider">
    <Helmet>
          <meta charSet="utf-8" />
          <title>Z-Eye</title>
        </Helmet>
    <Eye />
    
  </ChakraProvider>
)

export default IndexPage
