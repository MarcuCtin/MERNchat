import React from 'react'
import Register from './register'
import { UserContext,UserContextProvider } from './UserContext';
import { useContext } from 'react';
import Chat from './Chat';

const Routes = () => {
    const {username,id} = useContext(UserContext);
    if(username && id){
      console.log('reqturning chat username valid')
        return <Chat/>
    }else{
  return (
    <Register />
  )}
}

export default Routes