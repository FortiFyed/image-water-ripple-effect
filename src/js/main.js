import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js'
import Shader from './shaders.js'

const rand = (a, b) => a + (b - a) * Math.random()

export default class Animate extends Shader{

    constructor(emptySpaceIntensity=1, waveStrength=2, waveArea=6, waveSpeed=0.01) {
        super()

        this.params = { emptySpaceIntensity, waveStrength, waveArea, waveSpeed }
        this.initGlobalVars(emptySpaceIntensity, waveStrength, waveArea, waveSpeed)
        this.initCamera()
        this.initScene()
        this.initLights()
        
        for(let i=0; i<1; i++){
            this.createMesh()
        }
        // this.objects[0].position.set(-5.5, 0, 0)
        // this.objects[1].position.set(0, 0, 0)
        // this.objects[2].position.set(5.5, 0, 0)

        this.initEvents()
        this.render()
    }

    initScene(){
        this.scene = new THREE.Scene()
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.querySelector('.container').appendChild(this.renderer.domElement)
    }

    initCamera(){
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.01, 100)
        this.camera.position.set(0, 0, 6)
    }

    initGlobalVars(){
        this.time = 0
        this.payhead = 0
        this.mouseOver = 0
        this.playhead = rand(0, 1)
        this.objects = []
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }
        this.mouse = new THREE.Vector2()
        this.mouse.x = (document.scrollingElement.clientHeight / this.sizes.width) * 2 - 1
        this.mouse.y = -(document.scrollingElement.clientWidth / this.sizes.height) * 2 + 1

        this.loader = new THREE.TextureLoader()
        this.material = null
        this.geometry = null
        this.mesh = null
    }

    initEvents(){
        window.addEventListener('resize', () => {
            // Update sizes
            this.sizes.width = window.innerWidth
            this.sizes.height = window.innerHeight
            
            // Update camera
            this.camera.aspect = this.sizes.width / this.sizes.height
            this.camera.updateProjectionMatrix()
            
            // Update renderer
            this.renderer.setSize(this.sizes.width, this.sizes.height)
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        })
        
        window.addEventListener('mousemove', (e) => onMouseMove(e))
        let that = this
        function onMouseMove(event) {
            gsap.to(that.mouse, {
                duration: .5,
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1,
            })
        }
    }

    initLights() {
		const ambientlight = new THREE.AmbientLight(0xffffff, 2)
		this.scene.add(ambientlight)
	}

    createMesh(){
        const texture = this.loadTexture('image.jpg')
        this.material = new THREE.ShaderMaterial({ 
            fragmentShader: this.getFragment(),
            vertexShader: this.getVertex(),
            uniforms: {
                time: { type: 'f', value: 0 },
                image: { type: 't', value: texture },
                mouseOver: { type: 'f', value: this.mouseOver },
                emptySpaceIntensity: { type: 'f', value: this.params.emptySpaceIntensity },
                waveStrength: { type: 'f', value: this.params.waveStrength},
                waveArea: { type: 'f', value: this.params.waveArea},
                waveSpeed: { type: 'f', value: this.params.waveSpeed},
            },
            side: THREE.DoubleSide,
            transparent: true,
        })

        this.geometry = new THREE.PlaneGeometry(15, 7, 5);
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.mesh)

        this.objects.push(this.mesh)
    }

    imageRaycaster(){
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(this.mouse, this.camera)
        const intersects = raycaster.intersectObjects(this.objects)
        
        for(const intersect of intersects){
            if(this.objects.find(object => object === intersect.object)){
                const timeline = gsap.timeline()
                timeline.to(intersect.object.scale, {
                    duration: 1,
                    x: 1.1,
                    y: 1.1,
                    z: 1.1,
                    ease: "Power0.easeInOut"
                })
                .to(intersect.object.material.uniforms.mouseOver, {
                    duration: 1,
                    value: 1,
                    ease: "Power0.easeInOut"
                }, '-=.9')
            }
        }

        for(const object of this.objects){
            if(!intersects.find(intersect => intersect.object === object)){
                const timeline = gsap.timeline()
                timeline.to(object.scale, {
                    duration: 1,
                    x: 1,
                    y: 1,
                    z: 1,
                    ease: "Power0.easeInOut"
                })
                .to(object.material.uniforms.mouseOver, {
                    duration: 1,
                    value: 0,
                    ease: "Power0.easeInOut"
                }, '-=1')
            }
        }
    }

    render(){
        this.time++
        this.playhead = rand(0, 1)
        this.imageRaycaster()

        this.material.uniforms.time.value = this.time
        this.renderer.render(this.scene, this.camera)
        window.requestAnimationFrame(this.render.bind(this))
    }
    
    loadTexture(texture){
        if(typeof texture === 'array'){
            let a = []
            for(let i=0; i<texture.length; i++){
                a.push(
                    this.loader.load(`./img/${texture[i]}`)
                )
            }
            return a 
        }else{
            return this.loader.load(`./img/${texture}`)
        }
    }
}

new Animate(1, 3, 6, 0.01)