const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors")

const {getUser,getUsersInRoom,addUser,removeUser} = require("./users")

const app = express()
const PORT = process.env.PORT || 5000
const router = require("./router")

const server = http.createServer(app)
const io = socketio(server)

io.on("connection",(socket)=>{ //the param is a socket that is gonna be connected as a client side socket
    console.log("We have a new connection!!!!")


    //join is the name of the event we throw , it can be join or any other descriptive word for your event
    socket.on("join",({name,room},cb)=>{ //now we can access these data from the backend
     const {error,user} = addUser({id:socket.id, name , room});
    

        //add user can get an error or a user , if it had a user OK but if it had a error ,here we had a functinal error handling method
        if(error){ 
          return cb(error) //this callback it returns to a third param on the socket.emit on the frontend
        }



        //admin messages   //backend send to frontend
        socket.emit("message", {user:"admin" , text: `${user.name}, Welcome to the room ${user.room} `}) //initial message for eachOne that joins the room and its conversation is empty,  CLIENT JOINING SCREEN
        socket.broadcast.to(user.room).emit("message", {user:"admin", text:  `${user.name}, Has Joined!`})//the message we broadcast , tha we "shout" to every joined client , ALREADY WAS CONNECTED CLIENT SCREEN

        socket.join(user.room) //join in this case is a method of socket , and with it we store a user in a room
       
        io.to(user.room).emit("roomData", {room:user.room ,users:getUsersInRoom(user.room)})
        cb()
    })

            //users messages   //frontend send to backend expects
    socket.on("sendMessage",(message,cb)=>{
        const user = getUser(socket.id)
        console.log(user)

        io.to(user.room).emit("message", {user: user.name , text : message})
        io.to(user.room).emit("roomData", {room: user.room , users:getUsersInRoom(user.room)})


        cb() //the callback executes when the frontend sends a message
    })

    socket.on("disconnect",()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message", {user:"admin", text:`${user.name} has left.`})
        }
    })
})
app.use(cors())
app.use(router)



server.listen(PORT,()=>{
    console.log( ` Server is runing on ${PORT} ` )
})