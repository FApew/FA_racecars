//### Coded by FA_pew ###
//Server
const socket = new io("http://localhost:3500/")

//Dependencies
import * as THREE from "three"
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm"
import WebGL from "three/addons/capabilities/WebGL.js"
import CannonDebugger from "https://cdn.jsdelivr.net/npm/cannon-es-debugger@1.0.0/+esm"
import Stats from "three/addons/libs/stats.module.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

//Files imports
import { Objs } from "/public/js/objects.js"

//Elements
const container = document.getElementById("three")
const idElm = document.getElementById("idTxt")

//Scenes & loaders
const scene = new THREE.Scene()
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.806, 0),
})
const loader = new GLTFLoader()

//Vars
let pi = Math.PI, users = 0, userID = 0

if (WebGL.isWebGLAvailable()) {
    socket.emit("join")

    //Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.z = 5
    camera.position.y = 2
    camera.rotation.x = -pi/4

    //Renderer
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setAnimationLoop(animate)
    container.appendChild(renderer.domElement)

    //Physic plane
    const cPlane = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
    })
    cPlane.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(cPlane)

    //Obj Init
    let gObjs = [], pObjs = [], objGroup = new THREE.Group()
    for (let i = 0; i < Objs.length; i++) {
        let obj = Objs[i]
        //Load Model
        loader.load(`../assets/${obj.model}`, (gltf) => {
            const model = gltf.scene
            model.traverse((child) => {
                if (child.isMesh) {
                    const material = new THREE.MeshStandardMaterial({
                        color: child.material.color,
                        map: child.material.map,
                        side: THREE.DoubleSide
                    })
                    child.material = material
                    child.castShadow = true
                    child.receiveShadow = true
                    child.geometry.computeVertexNormals()
                }
            })

            //Apply Scale
            model.scale.set(obj.s, obj.s, obj.s)

            //Get Size
            let box = new THREE.Box3().setFromObject(model)
            let size = new THREE.Vector3()
            box.getSize(size)

            //Add Graphics
            model.position.set(obj.pos.x, obj.pos.y + size.y/2, obj.pos.z)
            model.rotation.set(0, obj.r, 0)
            gObjs[i] = model
            objGroup.add(model)

            //Add Physics
            if (obj.p) {
                const pObj = new CANNON.Body({
                    shape: new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2)),
                    position: new CANNON.Vec3(obj.pos.x, obj.pos.y + size.y/2, obj.pos.z),
                    mass: obj.g == 1 ? 1 : 0
                })
                pObj.quaternion.setFromEuler(0, obj.r, 0)
                world.addBody(pObj)
                pObj.sleep()
                pObjs[i] = pObj
            } else {
                pObjs[i] = 0
            }
        })
    }

    //Update scene
    scene.add(objGroup)

    //Stats
    let stats = new Stats()
    stats.domElement.style.position = "absolute"
    stats.domElement.style.top = "50px"
    container.appendChild( stats.dom )
    
    //Cannon Debugger
    const cannonDebugger = new CannonDebugger(scene, world, {})

    //On resize event
    window.onresize = () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight )
    }
    
    //Multiplayer config
    let playerArr = []
    socket.on("join", (data) => {
        users = data
        if (userID == 0) {
            userID = users[users.length-1]
            idElm.innerHTML = `ID: ${userID}`
        }
    })
    socket.on("leave", (data) => {
        users = data
    })
    
    
    //Animate
    let t = Date.now(), dt
    function animate() {

        //Physic update
        dt = Date.now() - t
        world.step(1/60, dt)
        t = Date.now()

        //Object Update
        for (let i = 0; i < gObjs.length; i++) {
            try {
                if (pObjs[i] != 0) {
                    let gObj = gObjs[i], pObj = pObjs[i]
                    if (pObj.velocity.length() < 0.01) {
                        pObj.sleep()
                    } else {
                        gObj.position.copy(pObj.position)
                        gObj.quaternion.copy(pObj.quaternion) 
                    }
                }
            } catch (e) {
                console.warn(e)
            }
        }

        //Updates
        console.log(users.length)
        stats.update()
        cannonDebugger.update()
        renderer.render(scene, camera)
    }
}