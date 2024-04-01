import React from 'react'
import Avatar from './Avatar';
const Contact = ({id,onClick,selected,username,online}) => {

    return (
        <div onClick={() => onClick(id)} key={id}
            className={' flex gap-2 items-center border-gray-100 py-4 mr-2 rounded-r-2xl cursor-pointer pl-4' + (selected ? ' bg-gray-400 border-l-8 border-blue-400' : '')}>

            <Avatar online={online} username={username} userId={id} />
            <span className=' text-lg font-semibold text-white'>{username}</span>

        </div>
    )
}

export default Contact