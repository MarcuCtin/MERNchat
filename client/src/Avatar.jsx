import React from 'react'

const Avatar = ({ username, userId, online }) => {
    const colors = ['bg-red-200', 'bg-green-200', 'bg-blue-200',
        'bg-indigo-200', 'bg-purple-200', 'bg-pink-200']
    const userIdBase10 = parseInt(userId, 16);
   
    const colorIdx = userIdBase10 % colors.length;
    const color = colors[colorIdx];
    return (
        <div className={'w-8 relative text-center align-center flex h-8  rounded-full ' + color}>
            <div className='text-center w-full mt-1 items-center'>
                <span className=' relative font-semibold opacity-70'>{username[0]?.toUpperCase()}</span>
            </div>
            {online &&
                (<div className='absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full'></div>)
            }
            {!online &&
                (<div className='absolute right-0 bottom-0 w-3 h-3 bg-gray-500 rounded-full'></div>)
            }
        </div>
    )
}

export default Avatar