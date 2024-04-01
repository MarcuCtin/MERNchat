// require('dotenv').config();
// const express = require('express');
// const app = express();
// const mongoose = require('mongoose');
// const session = require('express-session')
// const passport = require('passport');
// const LocalStrategy = require('passport-local');
// const User = require('../api/models/user');
// const jwt = require('jsonwebtoken');
// const http = require('http')
// const cors = require('cors');
// const ws = require('ws');
// const Message = require('../api/models/message');
// //cors----------------
// app.use(cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true
// }));
// //mongoose----------------
// const MongoURL = process.env.MONGO_URL;
// mongoose.set('strictQuery', true);
// mongoose.connect(MongoURL);
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, "connection error:"));
// db.once('open', () => {
//     console.log('database connected');
// })
// //session----------------
// const secretKey = process.env.SECRET_KEY;
// const sessionConfig = {
//     secret: secretKey,
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//         httpOnly: true,
//         //secure:true
//         expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
//         maxAge: 1000 * 60 * 60 * 24 * 7,
//     }
// }
// //server----------------
// const server = http.createServer(app);
// const wss = new ws.WebSocketServer({ clientTracking: false, noServer: true });

// //cors----------------

// //session----------------
// app.use(express.json());
// const sessionParser = session(sessionConfig);
// app.use(sessionParser);
// //passportAUTH----------------
// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// //routes----------------
// app.get('/user', (req, res) => {
//     res.send(req.user);
// });
// app.post('/register', async (req, res) => {
//     // console.log(req.body);
//     try {

//         const { username, password } = req.body;
//         const user = new User({ username, password });
//         const registeredUser = await User.register(user, password);
//         req.login(registeredUser, (err) => {
//             if (err) { return next(err); }
//             res.json(registeredUser);
//         });
//     }
//     catch (err) {
//         console.log(err);
//         res.send(err);
//     }
// });  

// app.post('/login', passport.authenticate('local'), async (req, res) => {
//     if (req.user) {
//         const token = jwt.sign({ userId: req.user._id, username: req.user.username }, secretKey);
//         // Store the JWT in the session or send it to the client as needed
//         req.session.token = token; 
//         process.env.STATIC_TOKEN = token;      
//         res.json(req.user)
//     }
// })   
// app.get('/messages/:userId', async (req, res) => {
//     const {userId} = req.params;
//    try {
//     const messages = await Message.find({
//         $or: [
//             {from:userId},
//             {to:userId}
//         ]
//     }).sort({createdAt:1});
//     console.log(messages);
//     res.json(messages);
//    } catch (error) {
//     console.log(error);
//    }
// }) 
     
// app.get('/profile', async (req, res) => {
//     if (req.isAuthenticated()) {
//         res.json(req.user)
//     }
// })

// //websocket----------------

// const onSocketError = () => {
//     console.log('eroare');
//     wss.close();
// }
// function userFromJWT(token) {
//     console.log(token,'token');
//     const user = {};
//     jwt.verify(token, secretKey, {}, (err, userData) => {
//         if (err) throw err;
//         user.username = userData.username;
//         user.userId = userData.userId;
//     })
//     return user;
// }  
// let clients = new Set() //Set for managing online clients
// server.on('upgrade', function (request, socket, head) {
//     try {
//         socket.on('error', onSocketError);
//         console.log('Parsing session from request...');
//         sessionParser(request, {}, () => {
//             console.log('requrest not desotryed',request.session)
//             if (!request.session.passport) {
//                 socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
//                 console.log('request before destroyed',request.session)
//                 socket.destroy();
//                 return;
//             } else {  
//                 // console.log(request.session)
//                 // console.log(request.session,'request.session')
//                 const token = request.session.token;
//                 console.log(token,'token')
//                 let user = {};
//                 user = userFromJWT(token);
//                 clients.add(user);
//                 request.session.passport = user;

//                 if (request.session.passport) {
//                     wss.handleUpgrade(request, socket, head, function (ws) {
//                         console.log('upghradee')
//                         wss.clients = clients;
//                         wss.emit('connection', ws, request);
//                     });
//                 }
//             }
//         })
//         console.log('Session is parsed!');
//         socket.removeListener('error', onSocketError);
//     } catch (error) {
//         console.log(error);
//     }
// });

// wss.on('connection', function (connection, request) {
//     if (request.session.passport) {
//         connection.username = request.session.passport.username;
//         connection.userId = request.session.passport.userId;
//     }
//     [...wss.clients].forEach(function (client) {
//         connection.send(JSON.stringify(
//             {
//                 online: [...wss.clients].map(c => ({ username: c.username, userId: c.userId })) //sending online users to client side as object from array
//             }
//         ));
//     });
//     connection.on('message',async function (message) {
        
//         try {
//             const messageObj = JSON.parse(message);
//             const {recipientId,recipientUsername, type,text,fromId,fromUsername} = messageObj.message;
            
//         if(recipientId && type === 'postMessage') {
//             const messageDoc = await Message.create({
//                 from:fromId,
//                 to:recipientId,
//                 text:text,
//             }); 
//             const message={
//                 fromUsername:fromUsername,
//                 from:fromId,
//                 toUsername:recipientUsername,
//                 to:recipientId,
//                 text:text,
//                 _id:messageDoc._id,
//             };
//             // console.log(message);
//             [...wss.clients].forEach(function each(client) {
//                 if (client.userId === recipientId && client.readyState === connection.OPEN) {
//                     client.send(JSON.stringify(message));
//                 }
//             });
            
//         }
//         } catch (error) {
//             console.log(error);
//         }  
//     });
   
// });

// server.listen(8080, (req, res) => { console.log('Example app listening on port 3000!'); });