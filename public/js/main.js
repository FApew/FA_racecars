//### Coded by FA_pew ###

//Server
//const socket = new io("https://fa-racecars.onrender.com/")
const socket = new io("http://localhost:3500/")

//Dependencies
import * as THREE from "three"
import WebGL from "three/addons/capabilities/WebGL.js"
import Stats from "three/addons/libs/stats.module.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

//Files imports
import { plane, dirLight, hemiLight } from "/public/js/objects.js"

//Elements
const container = document.getElementById("three")
const idElm = document.getElementById("idTxt")

//Scenes & loaders
const scene = new THREE.Scene()
const loader = new GLTFLoader()
const clock = new THREE.Clock()

//Vars
let pi = Math.PI, userID = 0, worldBodies, bodies = new Map(), btn = {w: 0, a: 0, s: 0, d: 0, shift: 0}

if (WebGL.isWebGLAvailable()) {
    //Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 10, 6)
    camera.near = 5
    camera.far = 500
    camera.rotation.x = -pi/4
    camera.updateProjectionMatrix() 

    //Renderer
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setAnimationLoop(animate)
    container.appendChild(renderer.domElement)

    //Stats
    let stats = new Stats()
    stats.domElement.style.position = "absolute"
    stats.domElement.style.top = "50px"
    container.appendChild( stats.dom )

    //On resize event
    window.onresize = () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight )
    }

    //Plane & Lights
    scene.add(plane)
    scene.add(dirLight)
    scene.add(hemiLight)
    
    //Get userID
    socket.on("join", (data) => {
        if (userID == 0) {
            userID = data[data.length-1]
            idElm.innerHTML = `ID: ${userID}`
        }
    })

    //Get inputs
    document.addEventListener("keydown", (e) => {
        switch (e.key) {

            case "w":
            case "W":
            case "ArrowUp": {
                btn.w = 1
                break 
            }

            case "a":
            case "A":
            case "ArrowLeft": {
                btn.a = 1
                break
            }

            case "s":
            case "S":
            case "ArrowDown": {
                btn.s = 1
                break
            }

            case "d":
            case "D":
            case "ArrowRight": {
                btn.d = 1
                break
            }

            case "Shift": {
                btn.shift = 1
                break
            }
        }
        socket.emit("input", userID, btn)
    })

    document.addEventListener("keyup", (e) => {
        switch (e.key) {

            case "w":
            case "W":
            case "ArrowUp": {
                btn.w = 0
                break 
            }

            case "a":
            case "A":
            case "ArrowLeft": {
                btn.a = 0
                break
            }

            case "s":
            case "S":
            case "ArrowDown": {
                btn.s = 0
                break
            }

            case "d":
            case "D":
            case "ArrowRight": {
                btn.d = 0
                break
            }

            case "Shift": {
                btn.shift = 0
                break
            }
        }
        socket.emit("input", userID, btn)
    })
        
    //Update physics
    socket.on("updatePlayer", (data) => {
        //Get the data
        worldBodies = data.bodies     
        let IDs = worldBodies.map(body => (body.ID))
        worldBodies.forEach((bData) => {
            let body = bodies.get(bData.ID)

            // Create a body
            if (!body) {
                body = newBody(bData)
                bodies.set(bData.ID, body)
            }
        })
    
        //Remove Unused
        bodies.forEach((body, id) => {
            if (!IDs.includes(id)) {
                bodies.delete(id)
                scene.remove(body)
                if (body.geometry) {
                    body.geometry.dispose()
                }
                if (body.material) {
                    if (Array.isArray(body.material)) {
                        body.material.forEach(material => material.dispose())
                    } else {
                        body.material.dispose()
                    }
                }
            }
        })
    
        //Position Update
        worldBodies.forEach((bData) => {
            let body = bodies.get(bData.ID)
            if (body) {
                //Target Positions
                body.tPos = new THREE.Vector3(...bData.position)
                body.tQuat = new THREE.Quaternion(...bData.quaternion)
            }
        })
    })
    
    //Animate
    function animate() {
        let dt = clock.getDelta()

        bodies.forEach((body) => {
            body.position.lerp(body.tPos, dt * 10)
            body.quaternion.slerp(body.tQuat, dt * 10)
        })

        //Updates
        stats.update()
        renderer.render(scene, camera)
    }

    //Create new Body
    function newBody(data) {
        let body
        if (data.part) {
            body = new THREE.Mesh(
                new THREE.BoxGeometry(2, .85, 5.63),
                new THREE.MeshBasicMaterial({color: new THREE.Color().setHSL(data.color, 1, .3)})
            )
        } else {
            body = new THREE.Mesh(
                new THREE.SphereGeometry(.36),
                new THREE.MeshBasicMaterial({color: 0xffffff})
            )
        }
        
        scene.add(body)
        return body
    }
}