const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const botName = 'chatbot'

const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require ('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

//when client connects
io.on('connection',socket => {
socket.on('joinRoom',({username , room})=> {
    const user = userJoin(socket.id,username , room);

    socket.join(user.room);

    socket.emit('message', formatMessage(botName,'Welcome'));

    socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined`));

    // send users and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users : getRoomUsers(user.room)
    });
});
  
    //listen for chatMessage
    socket.on('chatMessage',msg =>{
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    socket.on('disconnect',() => {
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left`));
        };
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users : getRoomUsers(user.room)
        });
        
    });


});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`server running on port ${PORT}`));