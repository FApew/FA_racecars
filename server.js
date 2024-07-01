//### Coded by FA_pew ###

//Server Dependecies
import express from "express"
import { Server } from "socket.io"
import path from "path"
import { fileURLToPath } from "url"

//Dependencies
import * as CANNON from "cannon-es"

//### Server ###
const dir = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3500

const app = express()
app.use(express.static(path.join(dir, "public")))

app.get("/public/js/objects.js", (req, res) => {
    res.sendFile(dir + "/public/js/objects.js")
})

app.set('trust proxy', true)

const expServer = app.listen(PORT, () => {
    console.log(`Server (PORT: ${PORT})`)
})

const io = new Server(expServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

//Server World

//New Users
io.on("connection", socket => {
    
    //Join event
    let IP = socket.handshake.headers['x-real-ip'] || socket.handshake.headers['x-forwarded-for'] || socket.handshake.address
    users.push(socket.id)
    playerhandler(1, socket.id)
    console.log(`Connection: ${users.length} users [${IP}]`)
    console.log(users)
    io.emit("join", users)


    //Disconnection event
    socket.on("disconnect", () => {
        playerhandler(0, socket.id)
        users.splice(users.indexOf(socket.id), 1)
        console.log(`Disconnection: ${users.length} users`)
        console.log(users)
        io.emit("leave", users)
    })

    //Input change
    socket.on("input", (id, btn) => {
        let idx = users.indexOf(id)
        if (btn.w) {
            players[idx].W = 1
        } else {
            players[idx].W = 0
        }
        if (btn.a) {
            players[idx].A = 1
        } else {
            players[idx].A = 0
        }
        if (btn.s) {
            players[idx].S = 1
        } else {
            players[idx].S = 0
        }
        if (btn.d) {
            players[idx].D = 1
        } else {
            players[idx].D = 0
        }
        if (btn.shift) {
            players[idx].SHIFT = 1
        } else {
            players[idx].SHIFT = 0
        }
    })
})

//Update clock
setInterval(update, 50/3)

//Define world & vars
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.806, 0),
})
let pi = Math.PI, users = [], players = []

//Physic plane
const cPlane = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
})
cPlane.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
world.addBody(cPlane)
cPlane.id = -1

//Create & Remove Physical players
function playerhandler(b, id) {
    if (b) {
        const player = new CANNON.Body({
            shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.05, 0.15)),
            position: new CANNON.Vec3(0, 1, 0),
            mass: 1,
        })
        player.ID = id
        player.W = 0
        player.A = 0
        player.S = 0
        player.D = 0
        players[users.indexOf(id)] = player
        world.addBody(player)
    } else {
        let idx = users.indexOf(id)
        world.removeBody(players[idx])
        players.splice(idx, 1)
    }
}

//Update function
function update() {

    players.forEach((player) => {
        if (player.W) {
            player.position.z-=.3
        }
        if (player.A) {
            player.position.x-=.3
        }
        if (player.S) {
            player.position.z+=.3
        }
        if (player.D) {
            player.position.x+=.3
        }
    })

    world.step(1/60)

    const worldState = {
        bodies: world.bodies.filter(e => e.id != -1).map(body => ({
            ID: body.ID,
            position: body.position.toArray(),
            quaternion: body.quaternion.toArray()
        }))
    }
    //Emit update
    io.emit("update", worldState)
}