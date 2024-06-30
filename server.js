import express from "express"
import { Server } from "socket.io"
import path from "path"
import { fileURLToPath } from "url"

const dir = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3500

let users = []

const app = express()
app.use(express.static(path.join(dir, "public")))

app.get("/public/js/objects.js", (req, res) => {
    res.sendFile(dir + "/public/js/objects.js")
})

const expServer = app.listen(PORT, () => {
    console.log(`Server (PORT: ${PORT})`)
})

const io = new Server(expServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

io.on("connection", socket => {

    socket.on("join", () => {
        const IP = socket.handshake.address;
        users.push(socket.id)
        console.log(`Connection: ${users.length} users [${IP}]`)
        console.log(users)
        io.emit("join", users)
    })

    socket.on("disconnect", () => {
        try {
            users.splice(users.indexOf(socket.id), 1)
        } catch (e) {
            console.error(e)
        }
        console.log(`Disconnection: ${users.length} users`)
        console.log(users)
        io.emit("leave", users)
    })
})