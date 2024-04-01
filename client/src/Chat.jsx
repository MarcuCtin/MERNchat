import React, { useEffect, useState, useRef } from 'react'

import { useContext } from 'react';
import { UserContext } from './UserContext';
import { uniqBy } from 'lodash';
import Contact from './Contact';
import axios from 'axios';

const Chat = () => {
    const [ws, setWs] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [selectedContactId, setSelectedContact] = useState(null);
    const { username, id,setId,setLoggedUsername } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsersExceptMe, setOnlineUsersExceptMe] = useState({});
    const messagesBox = useRef();
    const divUnderMessages = useRef();
    const [offlineUsers, setOfflineUsers] = useState({});

    
    useEffect(() => {
        connectToWs();
    }, [])
    
    function connectToWs() {
        let ws = new WebSocket('ws://localhost:8080');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        // ws.addEventListener('close', () => {
        //     alert('user disconnected');
        // });
    }
   
    function showOnlineUsers(peopleArray) {
        const people = {}
        peopleArray.forEach(({ userId, username }) => {
            people[userId] = username;
        });
        setOnlineUsers(people);

    }
    
    function handleMessage(e) {
        const messageData = JSON.parse(e.data);
        
        if ('online' in messageData) 
        {
            const peopleOnline = messageData.online;
            let ok = 0;
            peopleOnline.forEach(({ userId, username }) => {
                if (onlineUsers.hasOwnProperty(userId)) {
                    ok = 1;
                }
            }
            )
            if (ok === 0)
                showOnlineUsers(messageData.online);
        }
        else
            if ('text' in messageData) {
                {
                    setMessages(prev => ([...prev, { ...messageData }]))
                
                }
            }
    }
     
    
    function sendNewMessage(e,file=null) {
       
        if(e) {
            e.preventDefault();
        }
        console.log(file)
        ws.send(JSON.stringify({
            message: {
                text: newMessage,
                recipientId: selectedContactId,
                recipientUsername: onlineUsers[selectedContactId],
                type: 'postMessage',
                fromUsername: username,
                fromId: id,
                file,
            },
        }
        ));
        setNewMessage('');
        let errorAlt ='';
        if (file) {
            axios.get('/messages/' + selectedContactId).then(response => {
                setMessages(response.data);
                if(!response.data[response.data.length - 1].file) {
                    errorAlt = 'file format unsupported';
                }
            })

        }
        setMessages(prev => {
            return ([...prev, {
                text: newMessage, isOur: true,
                fromUsername: username,
                to: selectedContactId,
                from: id,
                toUsername: onlineUsers[selectedContactId],
                type: 'senderMessage',
                _id: Date.now(),
                file: errorAlt!=='' ? errorAlt : null,
            }])
        })
        


    }
    function sendFile(e) {
        
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        console.log(e.target.files[0])
        reader.onload = () => {
            sendNewMessage(null,{
                data:reader.result,
                name:e.target.files[0].name
            })
        }
        
    }
    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages]);


        useEffect(() => {
        
           
            axios.get('/people').then((res) => {
                
               
                const offlineUsersArr = res.data
                    .filter(user =>!onlineUsers.hasOwnProperty(user._id) && user._id!== id);
                
                const offlineUsers ={};
                offlineUsersArr.forEach(u => {
                    offlineUsers[u._id] = u.username;
                });
                // const offlineUsers = offlineUsersArr.reduce((acc, user) => ({
                                //     ...acc,
                                //      [user._id]: user.username,
                //  }), {});this is the same as above
                
                setOfflineUsers(offlineUsers);
            });
           
            
        }, [onlineUsers]);

    
    
    useEffect(() => {
        if (selectedContactId) {
            axios.get('/messages/' + selectedContactId).then(response => {
                setMessages(response.data);
            })
        }
    }, [selectedContactId])
    const onlinePeopleExcludingMe = { ...onlineUsers };
    delete onlinePeopleExcludingMe[id];
    const messagesWithoutDuplicates = uniqBy(messages, '_id');
    function Logout() {
        axios.post('/logout').then(() => {
            
           setLoggedUsername(null);
            setId(null);
            setWs(null);
        });
    }
    return (
        <div className='flex w-full h-full backdrop-blur-lg rounded-xl'>
            <div className="relative shadow-xl bg-black/90 flex flex-col  w-1/3  pt-3 rounded-xl">
                <div className="text-white pb-2 pl-5 mb-5 mt font-italic font-bold text-2xl italic flex flex-">
                    Chattin'
                </div>
                <div>
                <div className=''>
                    {Object.keys(onlinePeopleExcludingMe).map(userId => (
                        <Contact id={userId} 
                        online={true}
                        key={userId}    
                        onClick={() => setSelectedContact(userId)} 
                        selected ={selectedContactId === userId}
                         username={onlinePeopleExcludingMe[userId]}
                        />
                    ))}

                </div>
                
                <div className=''>
                    {Object.keys(offlineUsers).map(userId => (
                        <Contact id={userId} 
                        online={false}
                        key={userId}    
                        onClick={() => setSelectedContact(userId)} 
                        selected ={selectedContactId === userId}
                        username={offlineUsers[userId]}
                        />
                    ))}
                    
                </div>
                
                </div>
                <div className="mt-auto mb-3 ml-3 text-white">Logged as <b>{username}</b> 
                        <button onClick={Logout} className=' text-sm px-5 bg-white text-black rounded-xl mx-2'>Logout</button>
                </div>
            </div>
            <div className="flex flex-col bg-black/70 w-2/3 rounded-xl ml-1">
                <div className='flex-grow '>
                    {
                        !selectedContactId && (
                            <div className='flex h-full items-center justify-center'>
                                <div className='gap-1 rounded-xl opacity-50 text-xl'>
                                    <span>&larr;</span>
                                    Select a person
                                </div>
                            </div>
                        )
                    }
                    {
                        !!selectedContactId && (
                            <div className="relative h-full">
                                <div ref={messagesBox} key={selectedContactId} className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-2'>
                                    {messagesWithoutDuplicates.map((message) => (

                                        <div key={message._id} className={(message.from === id) ? 'text-right' : 'text-left'}>
                                            <div key={message._id} className={"text-left p-2 m-2 mx-5 inline-block w-50 rounded-xl text-md " + (message.from === id ? 'bg-white text-black' : 'bg-gray-400')}>

                                                {message.text}
                                                {message.file && (
                                                    
                                                    <div className='flex flex-row items-center justify-center'>
                                                       <a href={axios.defaults.baseURL +`/uploads/${message.file}`}>
                                                       <img src={axios.defaults.baseURL + '/uploads/' + message.file} alt={message.file} className='h-48 rounded-lg m-0 p-0'/>
                                                    
                                                       </a>
                                                    </div>
                                                )    
                                                }
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={divUnderMessages}></div>
                                </div>
                            </div>
                        )

                    }
                </div>

                {
                    !!selectedContactId && (
                        <form onSubmit={sendNewMessage} className='align-center flex gap-2 p-2 mx-2 mb-4'>
                            <input
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                type="text" placeholder=" Type a message" className='shadow lg bg-gray-600 border flex-grow p-2 rounded-xl' />
                            <label className='bg-gray-400 p-2 cursor-pointer rounded-xl'>
                                <input type="file" className='hidden' onChange={sendFile}/>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                </svg>

                            </label>
                            <button className='bg-white p-2  shadow  rounded-xl' type="submit">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>

                            </button>
                        </form>
                    )
                }

            </div>
        </div>
    )
}

export default Chat