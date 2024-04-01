import React from 'react'
import { createContext,useState,useEffect} from 'react'
export const UserContext = createContext({});
import axios from 'axios';
export function UserContextProvider({ children }) {
    const [username, setLoggedUsername] = useState('');
    const [id, setId] = useState('');
    useEffect(() => {
        try {
           
                axios.get('/profile').then((res) => {
                    setLoggedUsername(res.data.username);
                    setId(res.data.userId);
                })
            
        } catch (error) {
            console.log(error); 
        }
    },[]);

    return (
        <UserContext.Provider value={{ username, setLoggedUsername,id,setId }}>
            {children}
        </UserContext.Provider>
    )
}