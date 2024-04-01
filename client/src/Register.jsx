import React from 'react'
import { useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from './UserContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState('register');
  const { setLoggedUsername, setId } = useContext(UserContext);
  async function handleSubmit(ev) {
    ev.preventDefault();
    console.log('pula')
    const url = isLogin === 'register' ? '/register' : '/login';

    const { data } = await axios.post(url, { username, password })
    if (data) {
      setLoggedUsername(data.username);
      setId(data._id);
      console.log(data,'setting context after login')
    }

  }
  return (
    <div className='backdrop-blur bg-black/80 p-4 pt-0 rounded-lg flex items-center justify-center'>
      <form onSubmit={handleSubmit} className="w-52 h-40 mx-auto bottom-0 mb-10">
        <div className='text-2xl h-8 text-white mb-2 mt-1 flex text-center items-start flex-row justify-center w-full '>
          <h1 className='mb-'>{isLogin ==='register' ? 'Register' :'Login'}</h1>
        </div>
        <input value={username} onChange={ev => setUsername(ev.target.value)} type="text" placeholder='username' className='block w-full  rounded-md p-2 mb-2 shadow' />
        <input value={password} onChange={ev => setPassword(ev.target.value)} type="password" placeholder='password' className='block w-full rounded-md p-2 mb-2 shadow' />
        <button className='bg-white text-black hover:bg-gray-200 text-white block w-full rounded-md py-2 pt-1.5 font-semibold '>
          {isLogin === 'register' ? 'Register' : 'Login'}
        </button>
        <div className='text-white text-center'>
        {isLogin === 'register' &&
          (
            <div>Have An Account ? <button onClick={() => setIsLogin('login')}>Login</button> </div>

          )}
        {
          isLogin === 'login' &&
          (
            <div>Don't Have An Account? <button onClick={() => setIsLogin('register')}>Register</button> </div>
          )
        }
        </div>
      </form>
    </div>
  )
}

export default Register