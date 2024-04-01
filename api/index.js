const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Message = require('./models/message');
const ws = require('ws');
const app = express();
const fs = require('fs');
dotenv.config();

//mongoose----------------
const MongoURL = process.env.MONGO_URL;
mongoose.set('strictQuery', true);
mongoose.connect(MongoURL);
const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error:"));
db.once('open', () => {
    console.log('database connected');
})


app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use('/uploads', express.static(__dirname+ '/uploads'));

app.use(cookieParser());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

const jwtSecret = process.env.SECRET_KEY;
const bcryptSalt = bcrypt.genSaltSync(10);

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        } else {
            reject('no token');
        }
    });
} 
app.post('/logout', async (req, res) => {
    try {
        const token = req.cookies?.token;
        console.log(token)
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                res.clearCookie('token');
                res.cookie('token', '', {sameSite: 'none', secure: true, httpOnly: true});
                res.status(200).json({
                    message: 'Logged out successfully'
                });
            });
        } else {
            res.status(400).json({
                message: 'No token provided'
            });
        }
    } catch (error) {
        console.log(error);
    }
})
app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const messages = await Message.find({
            $or: [
                { from: userId },
                { to: userId }
            ]
        }).sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (error) {
        console.log(error);
    }
})

app.get('/people', async (req, res) => {
    try {
        const users = await User.find({},{'_id': 1, 'username': 1});
        res.json(users);
    } catch (error) {
        console.log(error);
    }
})

function userFromJWT(token) {
    
    if(token){
        const user = {};
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        user.username = userData.username;
        user.userId = userData.userId;
    })
    return user;
    }
}  
app.get('/profile', async (req, res) => {
    const token = req.cookies?.token;
    
    try {
     if(token){
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        
        res.json(userData).status(200);
      });}
    }
   catch (error) {
    console.log(error);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    const foundUser = await User.findOne({ username });
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
                res.cookie('token', token, { sameSite: 'none', secure: true }).json(foundUser);
            });
        }
    }
    
});
 
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
       
        const createdUser =  await User.create({
            username: username,
            password: hashedPassword,
        }); 

        jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
                id: createdUser._id,
            }); 
        });
    } catch (err) {
        if (err) throw err;
        res.status(500).json('error');
    }
});

const server = app.listen(8080);

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) => {

  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
          online: [...wss.clients].map(c => ({userId:c.userId,username:c.username})),
        }));
      });
  }
  try {
    connection.isAlive = true;
    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            connection.terminate();
            notifyAboutOnlinePeople();    
        }, 5000);
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });
  // read username and id form the cookie for this connection
  const cookies = req.headers.cookie;
  console.log('cookies', cookies);
  if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1];
      if (token) {
        connection.userId = userFromJWT(token).userId;
        connection.username = userFromJWT(token).username;
      }
    }
  }
  
  
  console.log(wss.clients.size,'clients');
  connection.on('message', async (message) => {
        try {
            const messageObj = JSON.parse(message);
            const {recipientId,recipientUsername, type,text,fromId,fromUsername,file} = messageObj.message;
            let filename = null;
            if(file){
                // fs.writeFile
                const parts = file.name.split('.');
                const ext  = parts[parts.length - 1];
                filename = `${Date.now()}.${ext}`;
                console.log(file)
                const path = __dirname + `/uploads/${filename}`;
                const fileData =  Buffer.from(file.data.split(',')[1] , 'base64');
                fs.writeFile(path, fileData, (err) => {
                    if (err) throw err;
                    console.log('File saved!');
                });
            }
                if(type === 'postMessage' && recipientId && (text || file)) {
            //store the message in the database
            console.log(filename)
            const messageDoc = await Message.create({
                from:fromId,
                to:recipientId,
                text:text,
                file: file ? filename : null,
            }); 
            //store the message in the database
            //message to the client side
            const message={
                fromUsername:fromUsername,
                from:fromId,
                toUsername:recipientUsername,
                to:recipientId,
                text:text,
                _id:messageDoc._id,
                file: file? filename : null,
            };
            [...wss.clients].forEach(function each(client) {
                if (client.userId === recipientId && client.readyState === connection.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
            
        }
        } catch (error) {
            console.log(error);
        }  
    
  });

  // notify everyone about online people (when someone connects)
  notifyAboutOnlinePeople();
  } catch (error) {
    console.log(error);
  }
});
