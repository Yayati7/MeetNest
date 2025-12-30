import { Server } from "socket.io"
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";


let connections = {}
let messages = {}
let timeOnline = {}
const users = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", async ({ path, username }) => {

            // ---------- EXISTING LOGIC (UNCHANGED) ----------
            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)
            users[socket.id] = username;

            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit(
                    "user-joined",
                    socket.id,
                    connections[path],
                    users
                )
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    )
                }
            }

            // ---------- 🔴 ADDED: HISTORY SAVE (FIX-2) ----------
            try {
                const user = await User.findOne({ username });
                if (!user) return;

                const existingMeeting = await Meeting.findOne({
                    meetingCode: path,
                    user_id: username
                });

                if (!existingMeeting) {
                    await Meeting.create({
                        meetingCode: path,
                        user_id: username
                    });
                }
            } catch (err) {
                console.error("Error saving meeting history:", err);
            }
        });


        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {


                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("media-update", (socketId, media) => {

            const [room, found] = Object.entries(connections)
                .reduce(([room, ok], [key, users]) => {
                    if (!ok && users.includes(socket.id)) return [key, true];
                    return [room, ok];
                }, ["", false]);

            if (!found) return;

            connections[room].forEach(id => {
                io.to(id).emit("media-update", socketId, media);
            });
        });


        socket.on("disconnect", () => {

            delete users[socket.id];

            var diffTime = Math.abs(timeOnline[socket.id] - new Date())

            var key

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        var index = connections[key].indexOf(socket.id)

                        connections[key].splice(index, 1)


                        if (connections[key].length === 0) {
                            delete connections[key]
                        }
                    }
                }

            }


        })


    })


    return io;
}

export default connectToSocket;