import { Vector3, Color, PlaneGeometry, Float32BufferAttribute, SRGBColorSpace, Mesh, MeshStandardMaterial, DirectionalLight, HemisphereLight  } from "three"

const vtx = new Vector3()
const col = new Color()
let gPlane = new PlaneGeometry( 2000, 2000, 80, 80)
gPlane.rotateX(-Math.PI/2)
let position = gPlane.attributes.position

for (let i = 0; i < position.count; i++) {
    vtx.fromBufferAttribute( position, i)
    vtx.x += Math.random() * 8 - 4
    vtx.z += Math.random() * 8 - 4
    position.setXYZ(i, vtx.x*4, vtx.y, vtx.z*4)
}

gPlane = gPlane.toNonIndexed()
position = gPlane.attributes.position
const arrCol = []

for (let i = 0; i < position.count; i++) {
    col.setHSL(0, 0, 0.25+(Math.random() * 0.1 - 0.05), SRGBColorSpace) //#38A8FF
    arrCol.push(col.r, col.g, col.b)
}

gPlane.setAttribute('color', new Float32BufferAttribute(arrCol, 3))
const mPlane = new MeshStandardMaterial({ vertexColors: true, transparent: true })
export const plane = new Mesh(gPlane, mPlane)
plane.receiveShadow = true

export const dirLight = new DirectionalLight( 0xffffff, 3)
dirLight.color.setHSL( 0.1, 1, 0.95)
dirLight.position.set( -10, 45, 2.3)
dirLight.castShadow = true
let shadow = dirLight.shadow.camera
let fSize = 110      
shadow.top = fSize*2
shadow.right = fSize*2
shadow.bottom = -fSize
shadow.left = -fSize*3
let sSize = 4096
dirLight.shadow.mapSize.width = sSize
dirLight.shadow.mapSize.height = sSize
dirLight.shadow.camera.bias = -0.005
dirLight.shadow.bias = -0.005

export const hemiLight = new HemisphereLight( 0xe1e1e1, 0xc5c5c5, 1.8)
hemiLight.position.set( 0, 50, 0)