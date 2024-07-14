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
        if (idx !== -1 && players[idx]) {
            players[idx].W = btn.w ? 1 : 0
            players[idx].A = btn.a ? 1 : 0
            players[idx].S = btn.s ? 1 : 0
            players[idx].D = btn.d ? 1 : 0
            players[idx].R = btn.r ? 1 : 0
            players[idx].SHIFT = btn.shift ? 1 : 0
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

const speed = 300, steer = pi/20, damp = .8, friction = 10, maxForce = 100

//Physic plane
const cPlane = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: new CANNON.Material({friction: 20, restitution: 0})
})
cPlane.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
world.addBody(cPlane)
cPlane.id = -1

//Create & Remove Physical players
function playerhandler(b, id) {
    if (b) {
        let chassis = new CANNON.Body({
            mass: 740,
            position: new CANNON.Vec3(0,0.05,0),
            rotation: new CANNON.Quaternion(),
        })
        chassis.addShape(new CANNON.Box(new CANNON.Vec3(1, .425, 2.815)), new CANNON.Vec3(0, 10, 0))

        let player = new CANNON.RigidVehicle({
            chassisBody: chassis
        })

        let wMat = new CANNON.Material("wheel")
        wMat.friction = friction
        let wShp = new CANNON.Sphere(.72/2)

        let whl1 = new CANNON.Body({
            mass: 14,
            material: wMat,
        })
        whl1.addShape(wShp)
        whl1.angularDamping = damp

        let whl2 = new CANNON.Body({
            mass: 14,
            material: wMat,
        })
        whl2.addShape(wShp)
        whl2.angularDamping = damp

        let whl3 = new CANNON.Body({
            mass: 12,
            material: wMat,
        })
        whl3.addShape(wShp)
        whl3.angularDamping = damp

        let whl4 = new CANNON.Body({
            mass: 12,
            material: wMat,
        })
        whl4.addShape(wShp)
        whl4.angularDamping = damp
        
        player.addWheel({
            body: whl1,
            position: new CANNON.Vec3(-.8, -.115, -2.015),
            axis: new CANNON.Vec3(1,0,0),
            direction: new CANNON.Vec3(0,-1,0),
        })

        player.addWheel({
            body: whl2,
            position: new CANNON.Vec3(.8, -.115, -2.015),
            axis: new CANNON.Vec3(1,0,0),
            direction: new CANNON.Vec3(0,-1,0),
        })

        player.addWheel({
            body: whl3,
            position: new CANNON.Vec3(.8, -.115, 1.585),
            axis: new CANNON.Vec3(1,0,0),
            direction: new CANNON.Vec3(0,-1,0),
        })

        player.addWheel({
            body: whl4,
            position: new CANNON.Vec3(-.8, -.115, 1.585),
            axis: new CANNON.Vec3(1,0,0),
            direction: new CANNON.Vec3(0,-1,0),
        })

        const consLB = new CANNON.HingeConstraint(chassis, whl1, {
            pivotA: new CANNON.Vec3(-.8, -.115, -2.015),
            axisA: new CANNON.Vec3(1, 0, 0),
            maxForce: maxForce
        })
        consLB.enableMotor()
        world.addConstraint(consLB)
        player.consLB = consLB
    
        const consRB = new CANNON.HingeConstraint(chassis, whl2, {
            pivotA: new CANNON.Vec3(.8, -.115, -2.015),
            axisA: new CANNON.Vec3(1, 0, 0),
            maxForce: maxForce
        })
        consRB.enableMotor()
        world.addConstraint(consRB)
        player.consRB = consRB
        
        player.chassisBody.ID = id
        player.chassisBody.COLOR = Math.random()
        player.W = 0
        player.A = 0
        player.S = 0
        player.D = 0
        player.R = 0
        players[users.indexOf(id)] = player
        player.addToWorld(world)
        console.log(id, " added")
    } else {
        let idx = users.indexOf(id)
        players[idx].removeFromWorld(world)
        players.splice(idx, 1)
    }
}

//Update function
function update() {

    players.forEach((player) => {
        player.consLB.disableMotor()
        player.consRB.disableMotor()
        player.setSteeringValue(0, 0)
        player.setSteeringValue(0, 1)
        if (player.W) {
            player.consLB.enableMotor()
            player.consRB.enableMotor()
            player.consLB.setMotorSpeed(speed)
            player.consRB.setMotorSpeed(speed)
        }
        if (player.A) {
            player.setSteeringValue(steer, 0)
            player.setSteeringValue(steer, 1)
        }
        if (player.S) {
            player.consLB.enableMotor()
            player.consRB.enableMotor()
            player.consLB.setMotorSpeed(-speed)
            player.consRB.setMotorSpeed(-speed)
        }
        if (player.D) {
            player.setSteeringValue(-steer, 0)
            player.setSteeringValue(-steer, 1)
        }
        if (player.R) {
            player.chassisBody.position.set(player.chassisBody.position.x, 10, player.chassisBody.position.z)
            const currentEuler = new CANNON.Vec3();
            player.chassisBody.quaternion.toEuler(currentEuler);
            player.chassisBody.quaternion.setFromEuler(0, currentEuler.y, 0);
            player.chassisBody.velocity = new CANNON.Vec3(0, 0, 0)
        }

        const dir1 = new CANNON.Vec3(0, 0, 1.585)
        const dir2 = new CANNON.Vec3(0, 0, -2.015)

        player.chassisBody.vectorToWorldFrame(dir1, dir1)
        player.chassisBody.vectorToWorldFrame(dir2, dir2)

        let downforce = -Math.min(5000 * (player.chassisBody.velocity.length() + 1), 100000);
        player.chassisBody.applyForce(new CANNON.Vec3(0, downforce, 0), dir1);
        player.chassisBody.applyForce(new CANNON.Vec3(0, downforce, 0), dir2);
    })

    world.step(1/60)

    const worldState = {
        bodies: world.bodies.filter(e => e.id != -1).map(body => ({
            ID: body.mass > 104 ? body.ID : body.id,
            position: body.position.toArray(),
            quaternion: body.quaternion.toArray(),
            part: body.mass > 104 ? 1 : 0,
            color: body.mass > 104 ? body.COLOR*10 : 0
        }))
    }
    //Emit update
    io.emit("updatePlayer", worldState)
}