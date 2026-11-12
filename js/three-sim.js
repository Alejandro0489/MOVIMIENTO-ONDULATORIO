/**
 * ============================================================================
 * SIMULADOR 3D CON THREE.JS - OSCILADOR ARMÓNICO HELICOIDAL
 * Cuaderno Digital Interactivo: Física 3 - Movimiento Ondulatorio
 * ============================================================================
 */

class ThreeSpringSim {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container || typeof THREE === 'undefined') return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.springMesh = null;
    this.massMesh = null;
    this.supportMesh = null;

    this.coils = 14;
    this.springRadius = 0.55;
    this.baseLength = 4.2;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 280;

    // Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x13171e);

    // Cámara
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 2.5, 8.5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xfff0dd, 0.65);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(5, 8, 6);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xc59b27, 0.8, 15);
    pointLight.position.set(-3, 2, 3);
    this.scene.add(pointLight);

    // Soporte Fijo (Pared de anclaje)
    const wallGeo = new THREE.BoxGeometry(0.5, 2.8, 2.2);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d312a, roughness: 0.6, metalness: 0.2 });
    this.supportMesh = new THREE.Mesh(wallGeo, wallMat);
    this.supportMesh.position.set(-3.5, 0, 0);
    this.scene.add(this.supportMesh);

    // Suelo de laboratorio con cuadrícula sutil
    const gridHelper = new THREE.GridHelper(12, 12, 0xc59b27, 0x2d3748);
    gridHelper.position.y = -1.4;
    this.scene.add(gridHelper);

    // Masa Oscilante (Bloque metálico de latón dorado)
    const massGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const massMat = new THREE.MeshStandardMaterial({
      color: 0xc59b27,
      metalness: 0.85,
      roughness: 0.25
    });
    this.massMesh = new THREE.Mesh(massGeo, massMat);
    this.massMesh.castShadow = true;
    this.massMesh.position.set(1.5, 0, 0);
    this.scene.add(this.massMesh);

    // Crear Resorte Helicoidal inicial
    this.updateSpringGeometry(3.5);

    // Evento resize
    window.addEventListener('resize', () => this.onResize());

    // Interacción básica de arrastre de cámara (órbita manual)
    this.setupInteraction();

    this.render();
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setupInteraction() {
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    this.container.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Rotar ligeramente la cámara alrededor del centro
      const rotSpeed = 0.006;
      this.camera.position.x = this.camera.position.x * Math.cos(deltaX * rotSpeed) - this.camera.position.z * Math.sin(deltaX * rotSpeed);
      this.camera.position.z = this.camera.position.z * Math.cos(deltaX * rotSpeed) + this.camera.position.x * Math.sin(deltaX * rotSpeed);
      this.camera.position.y = Math.max(0.5, Math.min(6.0, this.camera.position.y - deltaY * rotSpeed * 2));
      this.camera.lookAt(0, 0, 0);
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
  }

  // Genera la curva helicoidal 3D para el resorte en base a la longitud actual
  updateSpringGeometry(currentLength) {
    if (this.springMesh) {
      this.scene.remove(this.springMesh);
      if (this.springMesh.geometry) this.springMesh.geometry.dispose();
    }

    const startX = -3.25;
    const numPoints = 260;
    const points = [];

    for (let i = 0; i <= numPoints; i++) {
      const u = i / numPoints;
      const px = startX + u * currentLength;
      const angle = u * Math.PI * 2 * this.coils;
      const py = Math.sin(angle) * this.springRadius;
      const pz = Math.cos(angle) * this.springRadius;
      points.push(new THREE.Vector3(px, py, pz));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 180, 0.065, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });

    this.springMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.springMesh.castShadow = true;
    this.scene.add(this.springMesh);
  }

  // Se llama en cada fotograma desde el PhysicsLab
  update(currentDisplacement) {
    if (!this.massMesh) return;

    // Escalar desplazamiento físico a unidades 3D
    const scaleFactor = 12.0;
    const massX = 1.0 + currentDisplacement * scaleFactor;
    this.massMesh.position.x = massX;

    const currentSpringLength = massX - (-3.25) - 0.6;
    if (currentSpringLength > 0.5) {
      this.updateSpringGeometry(currentSpringLength);
    }

    this.render();
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resetCamera() {
    this.camera.position.set(0, 2.5, 8.5);
    this.camera.lookAt(0, 0, 0);
  }
}

window.ThreeSpringSim = ThreeSpringSim;
