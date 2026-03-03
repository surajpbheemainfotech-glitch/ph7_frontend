import React from 'react'
import LotteryCards from '../components/LotteryCards'
import Marque from '../components/Marque'
import SpinWheel from '../components/Lucky-Wheel/SpinWheel'
function Home() {
  return (
    <>
    <Marque/>
    <LotteryCards />
    {import.meta.env.VITE_FLAG_V === "V1" && (
         <SpinWheel/>
      )}

   
    </>
  )
}

export default Home