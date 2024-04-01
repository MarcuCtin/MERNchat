
import './App.css'
import axios from 'axios'
import Routes from './Routes'
import { useRef,useEffect } from 'react';
import * as THREE from 'three';
import FOG from 'vanta/dist/vanta.fog.min';
import { UserContext,UserContextProvider } from './UserContext';
function App() {
  axios.defaults.baseURL = 'http://localhost:8080';
  axios.defaults.withCredentials=true;
  const myRef = useRef(null);
  useEffect(() => {
    // Make sure the script is loaded only once
    if (!window.VANTA) {
        window.VANTA = {
            THREE: THREE,
        };
    }
    // Initialize Vanta
    let vantaEffect = FOG({
        el: myRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        highlightColor: 0xe0e0e,
        midtoneColor: 0x0,
        lowlightColor: 0xffffff,
        blurFactor: 0.66,
        zoom: 1.4,
        baseColor: 0xffffff,
    });

    // Destroy Vanta effect when the component unmounts
    return () => {
        if (vantaEffect) vantaEffect.destroy();
    };
}, []);

  return (
    <>
     <UserContextProvider>
     <div ref={myRef} className='p-6 h-screen w-screen flex items-center justify-center'>
     <Routes />
     </div>
     </UserContextProvider>
    </>
  )
}

export default App
