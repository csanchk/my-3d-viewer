console.log("Starting 3D Viewer");

class App {
    constructor() {
        console.log("App constructor running");
        this.scene = new THREE.Scene();
        this.container = document.querySelector('#scene-container');
        this.createRenderer();
        this.createCamera();
        this.createLights();
        this.createControls();
        this.createRoom();
        this.selectedObject = null;
        this.moveMode = false;

        this.setupEventListeners();
        this.animate();
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 5, 10);
    }

    createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
    }

    createRoom() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            side: THREE.DoubleSide
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        
        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 5),
            wallMaterial
        );
        backWall.position.z = -5;
        backWall.position.y = 2.5;
        this.scene.add(backWall);

        // Side walls
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 5),
            wallMaterial
        );
        leftWall.position.x = -5;
        leftWall.position.y = 2.5;
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 5),
            wallMaterial
        );
        rightWall.position.x = 5;
        rightWall.position.y = 2.5;
        rightWall.rotation.y = -Math.PI / 2;
        this.scene.add(rightWall);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.getElementById('modelUpload').addEventListener('change', 
            this.onModelUpload.bind(this));
        document.getElementById('toggleMove').addEventListener('click',
            this.toggleMoveMode.bind(this));
        this.renderer.domElement.addEventListener('click', 
            this.onSceneClick.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async onModelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const loader = new GLTFLoader();
        const url = URL.createObjectURL(file);

        try {
            const gltf = await new Promise((resolve, reject) => {
                loader.load(url, resolve, undefined, reject);
            });

            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            model.position.set(0, 0, 0);
            this.scene.add(model);
            this.selectedObject = model;

        } catch (error) {
            console.error('Error loading model:', error);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    toggleMoveMode() {
        this.moveMode = !this.moveMode;
        this.controls.enabled = !this.moveMode;
        console.log('Move mode:', this.moveMode ? 'enabled' : 'disabled');
    }

    onSceneClick(event) {
        if (!this.moveMode || !this.selectedObject) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObject(this.floor);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.selectedObject.position.x = point.x;
            this.selectedObject.position.z = point.z;
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the application
window.addEventListener('load', () => {
    console.log("Window loaded, creating App");
    new App();
});
