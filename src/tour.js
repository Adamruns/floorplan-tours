// Floor plan tour engine. World units are feet: plan x runs east, plan z runs south, y is up.

const EYE_HEIGHT = 5.35;
const PLAYER_RADIUS = 0.85;
const WALK_SPEED = 4.8;
const RUN_SPEED = 8.5;
const TURN_SPEED = 1.9;
const LOOK_SPEED = 0.0042;
const WALK_FOV = 72;
const OVERVIEW_FOV = 36;
const DOOR_HEAD = 6.67;
const UP = new THREE.Vector3(0, 1, 0);

function polygonArea(points) {
  let sum = 0;
  for (let index = 0; index < points.length; index++) {
    const [x1, z1] = points[index];
    const [x2, z2] = points[(index + 1) % points.length];
    sum += x1 * z2 - x2 * z1;
  }
  return sum / 2;
}

function polygonCentroid(points) {
  const area = polygonArea(points);
  let centerX = 0;
  let centerZ = 0;
  for (let index = 0; index < points.length; index++) {
    const [x1, z1] = points[index];
    const [x2, z2] = points[(index + 1) % points.length];
    const cross = x1 * z2 - x2 * z1;
    centerX += (x1 + x2) * cross;
    centerZ += (z1 + z2) * cross;
  }
  return { x: centerX / (6 * area), z: centerZ / (6 * area) };
}

function pointInPolygon(x, z, points) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const [xi, zi] = points[index];
    const [xj, zj] = points[previous];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function easeInOutCubic(progress) {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createMaterials() {
  const shaker = shakerDoorTexture();
  const drywall = drywallTexture();
  const materials = {
    cabinet: new THREE.MeshStandardMaterial({ color: '#6b707a', roughness: 0.55 }),
    cabinetDoor: new THREE.MeshStandardMaterial({ color: '#6b707a', roughness: 0.5, map: shaker }),
    carpet: new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: 1 }),
    // A little emission stands in for light bouncing off the floor, which keeps ceilings from reading gray.
    ceiling: new THREE.MeshStandardMaterial({ color: '#f7f6f2', roughness: 0.95, emissive: '#fffaf2', emissiveIntensity: 0.14, map: drywall, bumpMap: drywall, bumpScale: 0.4 }),
    concrete: new THREE.MeshStandardMaterial({ map: tileTexture({ rgb: [178, 174, 166], grout: 'rgb(150, 146, 140)', tileInches: 24, seed: 8 }), roughness: 0.9 }),
    counter: new THREE.MeshStandardMaterial({ map: counterTexture('granite-beige'), roughness: 0.22 }),
    doorSlab: new THREE.MeshStandardMaterial({ color: '#f7f6f2', roughness: 0.45, map: shaker }),
    exterior: new THREE.MeshStandardMaterial({ color: '#cbb89a', roughness: 0.95 }),
    facade: new THREE.MeshStandardMaterial({ map: facadeTexture(), roughness: 0.9 }),
    floorWood: new THREE.MeshStandardMaterial({ map: woodPlankTexture(), roughness: 0.42 }),
    glass: new THREE.MeshStandardMaterial({ color: '#dcebee', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.14, depthWrite: false }),
    ground: new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 }),
    mirror: new THREE.MeshStandardMaterial({ color: '#e9eff1', roughness: 0.02, metalness: 1 }),
    paint: new THREE.MeshStandardMaterial({ color: '#e4d9c8', roughness: 0.88, map: drywall, bumpMap: drywall, bumpScale: 0.5 }),
    plinth: new THREE.MeshStandardMaterial({ color: '#3b4043', roughness: 0.9 }),
    porcelain: new THREE.MeshStandardMaterial({ color: '#fbfbfa', roughness: 0.12 }),
    stainless: new THREE.MeshStandardMaterial({ color: '#b8b8b8', roughness: 0.3, metalness: 0.85 }),
    showerTile: new THREE.MeshStandardMaterial({ map: tileTexture({ rgb: [170, 160, 146], grout: 'rgb(150, 142, 130)', tileInches: 12, seed: 17 }), roughness: 0.35 }),
    stoneTile: new THREE.MeshStandardMaterial({ map: tileTexture({ rgb: [196, 190, 180], grout: 'rgb(176, 170, 161)', tileInches: 24, seed: 13 }), roughness: 0.3 }),
    subway: new THREE.MeshStandardMaterial({ map: subwayTileTexture(), roughness: 0.22 }),
    tile: new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: 0.35 }),
    trim: new THREE.MeshStandardMaterial({ color: '#f7f6f2', roughness: 0.45 }),
    wallCap: new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.9 }),
  };

  for (const name of ['carpet', 'ceiling', 'concrete', 'counter', 'facade', 'floorWood', 'paint', 'showerTile', 'stoneTile', 'subway', 'tile']) {
    materials[name].userData.tiled = true;
  }

  // Grout lines, plank seams and carpet pile read as depth when the color map doubles as a bump map.
  const BUMP_SCALES = { carpet: 1.2, concrete: 0.8, counter: 0.12, floorWood: 0.7, showerTile: 1.4, stoneTile: 1.4, subway: 1.6, tile: 1.4 };
  for (const [name, scale] of Object.entries(BUMP_SCALES)) {
    materials[name].bumpMap = materials[name].map;
    materials[name].bumpScale = scale;
  }

  for (const name of ['cabinetDoor', 'counter', 'porcelain', 'stainless', 'doorSlab']) {
    materials[name].userData.bevel = name === 'counter' ? 0.025 : 0.015;
  }

  return materials;
}

const FLOOR_MATERIALS = { carpet: 'carpet', concrete: 'concrete', stone: 'stoneTile', tile: 'tile', wood: 'floorWood' };

function createEnvironment(renderer) {
  const environmentScene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#76787a', side: THREE.BackSide }));
  room.scale.set(40, 14, 40);
  room.position.y = 6;
  environmentScene.add(room);

  function panel(width, height, x, y, z, rotationY, rotationX, color, strength) {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotationX, rotationY, 0);
    environmentScene.add(mesh);
  }

  panel(14, 14, 0, 12.9, 0, 0, Math.PI / 2, '#ffffff', 2.6);
  panel(18, 7, 0, 6, -19.9, 0, 0, '#cfe3f5', 6);
  panel(10, 6, 19.9, 5, 4, -Math.PI / 2, 0, '#fff1dd', 4);
  panel(30, 3, 0, -0.9, 0, 0, -Math.PI / 2, '#8a7560', 0.6);
  const generator = new THREE.PMREMGenerator(renderer);
  const texture = generator.fromScene(environmentScene, 0.04).texture;
  generator.dispose();
  return texture;
}

// Merges every static mesh into one mesh per material so a furnished unit draws in ~60 calls.
function mergeStaticMeshes(root, keep) {
  root.updateMatrixWorld(true);
  const dynamic = new Set();
  root.traverse((object) => {
    if (object.userData.dynamic) {
      object.traverse((child) => dynamic.add(child));
    }
  });

  const buckets = new Map();
  const merged = [];
  root.traverse((object) => {
    if (!object.isMesh || keep.has(object) || dynamic.has(object)) {
      return;
    }

    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const groups = Array.isArray(object.material) ? geometry.groups : [{ start: 0, count: geometry.attributes.position.count, materialIndex: 0 }];
    for (const group of groups) {
      const material = materials[group.materialIndex];
      const key = `${material.uuid}|${object.castShadow}`;
      if (!buckets.has(key)) {
        buckets.set(key, { material, castShadow: object.castShadow, parts: [], vertexCount: 0 });
      }
      const bucket = buckets.get(key);
      bucket.parts.push({ geometry, start: group.start, count: group.count });
      bucket.vertexCount += group.count;
    }
    merged.push(object);
  });

  for (const object of merged) {
    object.parent.remove(object);
  }

  const meshes = [];
  for (const bucket of buckets.values()) {
    const positions = new Float32Array(bucket.vertexCount * 3);
    const normals = new Float32Array(bucket.vertexCount * 3);
    const uvs = new Float32Array(bucket.vertexCount * 2);
    let offset = 0;
    for (const part of bucket.parts) {
      const position = part.geometry.attributes.position.array;
      const normal = part.geometry.attributes.normal.array;
      const uv = part.geometry.attributes.uv?.array;
      positions.set(position.subarray(part.start * 3, (part.start + part.count) * 3), offset * 3);
      normals.set(normal.subarray(part.start * 3, (part.start + part.count) * 3), offset * 3);
      if (uv) {
        uvs.set(uv.subarray(part.start * 2, (part.start + part.count) * 2), offset * 2);
      }
      offset += part.count;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.castShadow = bucket.castShadow;
    mesh.receiveShadow = true;
    root.add(mesh);
    meshes.push(mesh);
  }

  return meshes;
}

function classifySide(rooms, x, z) {
  const room = rooms.find((candidate) => pointInPolygon(x, z, candidate.polygon));
  return room && !room.outdoor ? 'indoor' : 'outdoor';
}

function buildWall(context, wall) {
  const { kit, materials, ceilingHeight, crown, rooms, world } = context;
  const [startX, startZ] = wall.from;
  const [endX, endZ] = wall.to;
  const length = Math.hypot(endX - startX, endZ - startZ);
  const directionX = (endX - startX) / length;
  const directionZ = (endZ - startZ) / length;
  const normalX = -directionZ;
  const normalZ = directionX;
  const thickness = wall.thickness ?? (wall.exterior ? 0.5 : 0.375);
  const angle = Math.atan2(-directionZ, directionX);
  const middleX = (startX + endX) / 2;
  const middleZ = (startZ + endZ) / 2;
  const sampleOffset = thickness / 2 + 0.6;
  const plusSide = classifySide(rooms, middleX + normalX * sampleOffset, middleZ + normalZ * sampleOffset);
  const minusSide = classifySide(rooms, middleX - normalX * sampleOffset, middleZ - normalZ * sampleOffset);
  const sideMaterial = (side) => (side === 'indoor' ? materials.paint : materials.exterior);
  const faceMaterials = [materials.paint, materials.paint, materials.wallCap, materials.wallCap, sideMaterial(plusSide), sideMaterial(minusSide)];
  const indoorSides = [plusSide === 'indoor' ? 1 : null, minusSide === 'indoor' ? -1 : null].filter((side) => side !== null);

  function pointAt(distance) {
    return [startX + directionX * distance, startZ + directionZ * distance];
  }

  function solidPiece(from, to, bottom, top, { collide = true, baseboard = true } = {}) {
    if (to - from < 0.01 || top - bottom < 0.01) {
      return;
    }

    const pieceLength = to - from;
    const [centerX, centerZ] = pointAt((from + to) / 2);
    const wallGeometry = new THREE.BoxGeometry(pieceLength, top - bottom, thickness);
    setBoxUVsInFeet(wallGeometry, pieceLength, top - bottom, thickness);
    const mesh = new THREE.Mesh(wallGeometry, faceMaterials);
    mesh.position.set(centerX, (bottom + top) / 2, centerZ);
    mesh.rotation.y = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.root.add(mesh);

    if (collide && bottom < 1) {
      world.colliders.push({ x: centerX, z: centerZ, halfWidth: pieceLength / 2, halfDepth: thickness / 2, angle });
    }

    if (crown && top > ceilingHeight - 0.01) {
      for (const side of indoorSides) {
        const molding = new THREE.Mesh(new THREE.BoxGeometry(pieceLength, 0.36, 0.1), materials.trim);
        molding.position.set(centerX + normalX * side * (thickness / 2 + 0.05), ceilingHeight - 0.18, centerZ + normalZ * side * (thickness / 2 + 0.05));
        molding.rotation.y = angle;
        world.root.add(molding);
      }
    }

    if (baseboard && bottom < 0.01) {
      for (const side of indoorSides) {
        const trim = new THREE.Mesh(new THREE.BoxGeometry(pieceLength, 0.33, 0.05), materials.trim);
        trim.position.set(centerX + normalX * side * (thickness / 2 + 0.025), 0.165, centerZ + normalZ * side * (thickness / 2 + 0.025));
        trim.rotation.y = angle;
        trim.receiveShadow = true;
        world.root.add(trim);
      }
    }
  }

  const openings = [...(wall.openings ?? [])].sort((first, second) => first.at - second.at);
  const startExtension = wall.extendStart ?? thickness / 2;
  const endExtension = wall.extendEnd ?? thickness / 2;
  let cursor = -startExtension;

  for (const opening of openings) {
    const isWindow = opening.kind === 'window';
    const head = opening.head ?? (isWindow ? 7.5 : DOOR_HEAD);
    const sill = isWindow ? opening.sill ?? 2 : 0;
    solidPiece(cursor, opening.at, 0, ceilingHeight);

    if (isWindow) {
      solidPiece(opening.at, opening.at + opening.width, 0, sill);
    }

    solidPiece(opening.at, opening.at + opening.width, head, ceilingHeight, { collide: false, baseboard: false });
    const blocks = isWindow || opening.style === 'entry' || opening.style === 'garage' || opening.closed;
    const [openingX, openingZ] = pointAt(opening.at + opening.width / 2);

    if (blocks) {
      world.colliders.push({ x: openingX, z: openingZ, halfWidth: opening.width / 2, halfDepth: thickness / 2 + 0.1, angle });
    }

    const group = new THREE.Group();
    group.position.set(openingX, 0, openingZ);
    group.rotation.y = angle;
    world.root.add(group);
    const swingSign = opening.swingTowards
      ? Math.sign((opening.swingTowards[0] - openingX) * normalX + (opening.swingTowards[1] - openingZ) * normalZ) || 1
      : indoorSides[0] ?? 1;
    buildOpening(kit, group, { ...opening, head, sill, thickness, indoorSides, swingSign });
    cursor = opening.at + opening.width;
  }

  solidPiece(cursor, length + endExtension, 0, ceilingHeight);
}

function buildOpening(kit, group, opening) {
  const { width, head, sill, thickness, indoorSides, swingSign } = opening;
  const isWindow = opening.kind === 'window';
  const bottom = isWindow ? sill : 0;
  const halfWidth = width / 2;

  kit.box(group, { width: 0.06, height: head - bottom, depth: thickness + 0.02, x: -halfWidth + 0.03, y: bottom, material: 'trim' });
  kit.box(group, { width: 0.06, height: head - bottom, depth: thickness + 0.02, x: halfWidth - 0.03, y: bottom, material: 'trim' });
  kit.box(group, { width, height: 0.06, depth: thickness + 0.02, y: head - 0.06, material: 'trim' });

  for (const side of indoorSides) {
    const faceZ = side * (thickness / 2 + 0.03);
    const casingBottom = isWindow ? sill - 0.35 : 0;
    for (const edge of [-1, 1]) {
      kit.box(group, { width: 0.29, height: head + 0.16 - casingBottom, depth: 0.06, x: edge * (halfWidth + 0.145), y: casingBottom, z: faceZ, material: 'trim', castShadow: false });
    }
    kit.box(group, { width: width + 0.62, height: 0.32, depth: 0.07, y: head + 0.02, z: faceZ, material: 'trim', castShadow: false });
    if (isWindow) {
      kit.box(group, { width: width + 0.75, height: 0.08, depth: 0.42, y: sill - 0.06, z: side * (thickness / 2 + 0.13), material: 'trim' });
      kit.box(group, { width: width - 0.1, height: 0.38, depth: 0.12, y: head - 0.45, z: side * (thickness / 2 - 0.12), material: 'trim', castShadow: false });
    }
  }

  if (isWindow) {
    buildWindowSash(kit, group, { width, bottom: sill, head, panes: opening.panes ?? (width > 3.6 ? 2 : 1), indoorSide: indoorSides[0] ?? 1 });
    return;
  }

  const style = opening.style ?? 'swing';
  const slabHeight = head - 0.04;

  if (style === 'swing') {
    const hingeX = opening.hinge === 'start' ? -halfWidth : halfWidth;
    const slabLength = width - 0.1;
    const slabX = hingeX - Math.sign(hingeX) * 0.12;
    const slabZ = swingSign * (thickness / 2 + slabLength / 2);
    kit.box(group, { width: 0.15, height: slabHeight, depth: slabLength, x: slabX, z: slabZ, material: 'doorSlab' });
    for (const face of [-1, 1]) {
      kit.sphere(group, { radius: 0.09, x: slabX + face * 0.14, y: 3.0, z: swingSign * (thickness / 2 + slabLength - 0.3), material: 'stainless', detail: 1, castShadow: false });
    }
  } else if (style === 'french') {
    const leafLength = halfWidth - 0.04;
    for (const edge of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.position.set(edge * (halfWidth - 0.1), 0, swingSign * (thickness / 2 + 0.02));
      group.add(leaf);
      const along = (offset) => swingSign * offset;
      kit.box(leaf, { width: 0.15, height: slabHeight, depth: 0.28, z: along(0.14), material: 'trim' });
      kit.box(leaf, { width: 0.15, height: slabHeight, depth: 0.28, z: along(leafLength - 0.14), material: 'trim' });
      kit.box(leaf, { width: 0.15, height: 0.75, depth: leafLength, z: along(leafLength / 2), material: 'trim' });
      kit.box(leaf, { width: 0.15, height: 0.35, depth: leafLength, y: slabHeight - 0.35, z: along(leafLength / 2), material: 'trim' });
      kit.box(leaf, { width: 0.03, height: slabHeight - 1.1, depth: leafLength - 0.5, y: 0.75, z: along(leafLength / 2), material: 'glass' });
      kit.sphere(leaf, { radius: 0.08, x: 0.12, y: 3.2, z: along(leafLength - 0.2), material: 'stainless', castShadow: false });
    }
  } else if (style === 'bifold') {
    const panelLength = width / 4 - 0.03;
    for (const edge of [-1, 1]) {
      for (let fold = 0; fold < 2; fold++) {
        kit.box(group, { width: 0.1, height: slabHeight, depth: panelLength, x: edge * (halfWidth - 0.12 - fold * 0.13), z: swingSign * (thickness / 2 + panelLength / 2 + 0.05), material: 'doorSlab' });
      }
    }
  } else if (style === 'garage') {
    kit.box(group, { width: width - 0.04, height: slabHeight, depth: 0.15, material: 'trim' });
    for (let panel = 1; panel < 4; panel++) {
      for (const face of [-1, 1]) {
        kit.box(group, { width: width - 0.2, height: 0.05, depth: 0.04, y: (slabHeight * panel) / 4, z: face * 0.09, material: kit.solid('#d8d6d0', { roughness: 0.6 }), castShadow: false });
      }
    }
  } else if (style === 'entry') {
    kit.box(group, { width: width - 0.04, height: slabHeight, depth: 0.15, material: 'doorSlab' });
    for (const face of [-1, 1]) {
      kit.sphere(group, { radius: 0.1, x: halfWidth - 0.35, y: 3.0, z: face * 0.15, material: 'stainless', castShadow: false });
      kit.cylinder(group, { radius: 0.09, height: 0.06, x: halfWidth - 0.35, y: 3.6, z: face * 0.1, rotationX: Math.PI / 2, material: 'stainless', castShadow: false }).position.set(halfWidth - 0.35, 3.6, face * 0.1);
    }
  }
}

function buildWindowSash(kit, group, { width, bottom, head, panes, indoorSide }) {
  const height = head - bottom;
  const frame = 'trim';
  // Two-inch white blinds, raised to the top third like the listing photos.
  const blindsBottom = head - height * 0.32;
  for (let slatY = head - 0.5; slatY > blindsBottom; slatY -= 0.16) {
    kit.box(group, { width: width - 0.16, height: 0.012, depth: 0.17, y: slatY, z: indoorSide * 0.17, rotationX: 0.25, material: 'trim', castShadow: true });
  }
  kit.box(group, { width: width - 0.14, height: 0.06, depth: 0.2, y: blindsBottom - 0.06, z: indoorSide * 0.17, material: 'trim' });
  kit.box(group, { width, height: 0.14, depth: 0.22, y: bottom, material: frame });
  kit.box(group, { width, height: 0.14, depth: 0.22, y: head - 0.14, material: frame });
  kit.box(group, { width: width - 0.1, height: 0.12, depth: 0.2, y: bottom + height * 0.5 - 0.06, material: frame });
  for (let index = 0; index <= panes; index++) {
    kit.box(group, { width: 0.14, height, depth: 0.22, x: -width / 2 + 0.07 + (index * (width - 0.14)) / panes, y: bottom, material: frame });
  }
  kit.box(group, { width: width - 0.1, height: height - 0.1, depth: 0.02, y: bottom + 0.05, material: 'glass' });
}

function startTour(plan) {
  const elements = {
    canvas: document.getElementById('scene'),
    chips: document.getElementById('room-chips'),
    finishes: document.getElementById('finishes'),
    finishesToggle: document.getElementById('finishes-toggle'),
    hint: document.getElementById('hint'),
    joystick: document.getElementById('joystick'),
    labels: document.getElementById('labels'),
    loading: document.getElementById('loading'),
    minimap: document.getElementById('minimap'),
    modeOverview: document.getElementById('mode-overview'),
    modeWalk: document.getElementById('mode-walk'),
    photoButton: document.getElementById('photo-button'),
    qualityToggle: document.getElementById('quality-toggle'),
    stagingToggle: document.getElementById('staging-toggle'),
    tour: document.getElementById('tour'),
  };

  document.getElementById('plate-eyebrow').textContent = plan.eyebrow;
  document.getElementById('plate-name').textContent = plan.name;
  document.getElementById('plate-specs').textContent = plan.specs;
  document.getElementById('plate-note').textContent = plan.note;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    elements.loading.querySelector('p').textContent = 'This tour needs WebGL. Open it in a recent version of Chrome, Safari, Edge or Firefox.';
    return;
  }

  // Phones and tablets start in standard quality; desktops start in HD. Either can switch with the HD button.
  const highQuality = !window.matchMedia('(pointer: coarse)').matches;
  setTextureScale(highQuality ? 2 : 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = plan.exposure ?? 0.85;
  setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.environment = createEnvironment(renderer);

  const materials = createMaterials();
  const world = {
    colliders: [],
    materials,
    mirrors: [],
    furnishings: new THREE.Group(),
    root: new THREE.Group(),
    spinners: [],
    textures: { fabric: fabricTexture() },
  };
  scene.add(world.root);
  scene.add(world.furnishings);
  const kit = createKit(world);
  if (plan.exteriorColor) {
    materials.exterior.color.set(plan.exteriorColor);
  }
  const ceilingHeight = plan.ceilingHeight ?? 9;

  const rooms = plan.rooms.map((room) => ({
    ...room,
    area: Math.abs(polygonArea(room.polygon)),
    centroid: room.labelAt ? { x: room.labelAt[0], z: room.labelAt[1] } : polygonCentroid(room.polygon),
  }));
  const bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const room of rooms) {
    for (const [x, z] of room.polygon) {
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minZ = Math.min(bounds.minZ, z);
      bounds.maxZ = Math.max(bounds.maxZ, z);
    }
  }
  const planCenter = new THREE.Vector3((bounds.minX + bounds.maxX) / 2, 0, (bounds.minZ + bounds.maxZ) / 2);
  const planRadius = Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2;

  const floorMeshes = [];
  const ceilingGroup = new THREE.Group();
  scene.add(ceilingGroup);

  for (const room of rooms) {
    const floorShape = new THREE.Shape(room.polygon.map(([x, z]) => new THREE.Vector2(x, -z)));
    const floorGeometry = new THREE.ShapeGeometry(floorShape);
    floorGeometry.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeometry, materials[FLOOR_MATERIALS[room.floor] ?? 'floorWood']);
    floor.receiveShadow = true;
    floor.userData.room = room;
    world.root.add(floor);
    floorMeshes.push(floor);

    const slab = new THREE.ExtrudeGeometry(floorShape, { depth: room.outdoor ? 0.6 : 1.0, bevelEnabled: false });
    slab.rotateX(-Math.PI / 2);
    slab.translate(0, -(room.outdoor ? 0.6 : 1.0) - 0.01, 0);
    const plinth = new THREE.Mesh(slab, materials.plinth);
    plinth.receiveShadow = true;
    world.root.add(plinth);

    if (!room.outdoor || room.covered) {
      const ceilingShape = new THREE.Shape(room.polygon.map(([x, z]) => new THREE.Vector2(x, z)));
      const ceilingGeometry = new THREE.ShapeGeometry(ceilingShape);
      ceilingGeometry.rotateX(Math.PI / 2);
      ceilingGeometry.translate(0, ceilingHeight, 0);
      const ceiling = new THREE.Mesh(ceilingGeometry, materials.ceiling);
      ceiling.castShadow = true;
      ceiling.receiveShadow = true;
      ceilingGroup.add(ceiling);
    }
  }

  const wallContext = { ceilingHeight, crown: plan.crownMolding ?? false, kit, materials, rooms, world };
  for (const wall of plan.walls) {
    buildWall(wallContext, wall);
  }

  plan.furnish(kit, { ceilingHeight });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(planCenter.x, -1.0, planCenter.z);
  ground.material.map.repeat.set(700 / 12, 700 / 12);
  ground.receiveShadow = true;
  scene.add(ground);

  for (const slab of plan.surroundings?.slabs ?? []) {
    kit.box(world.root, { width: slab.width, height: 0.06, depth: slab.depth, x: slab.x, y: -1.0, z: slab.z, material: kit.solid(slab.color ?? '#b9b6ae', { roughness: 0.95 }), castShadow: false });
  }

  for (const building of plan.surroundings?.buildings ?? []) {
    kit.box(world.root, { width: building.width, height: building.height, depth: building.depth, x: building.x, y: -1, z: building.z, material: 'facade' });
  }

  for (const [index, [x, z]] of (plan.surroundings?.trees ?? []).entries()) {
    kit.add('tree', { x, z, y: -1, seed: index + 3, height: 20 + (index % 3) * 4, collide: false });
  }

  for (const rotor of world.spinners) {
    rotor.userData.dynamic = true;
  }

  mergeStaticMeshes(world.root, new Set(floorMeshes));
  mergeStaticMeshes(world.furnishings, new Set());

  scene.add(new THREE.HemisphereLight('#fff6ea', '#8a7560', plan.hemisphereIntensity ?? 0.28));
  const sun = new THREE.DirectionalLight('#fff0db', 3.2);
  const sunDirection = plan.sun ?? [-0.55, 0.75, -0.6];
  sun.position.set(planCenter.x + sunDirection[0] * 80, sunDirection[1] * 80, planCenter.z + sunDirection[2] * 80);
  sun.target.position.copy(planCenter);
  scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(highQuality ? 4096 : 2048, highQuality ? 4096 : 2048);
  const shadowSpan = planRadius + 6;
  Object.assign(sun.shadow.camera, { left: -shadowSpan, right: shadowSpan, top: shadowSpan, bottom: -shadowSpan, near: 1, far: 220 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  const lightWeight = (room) => room.area * (room.lightScale ?? 1);
  const lightRooms = rooms.filter((room) => !room.outdoor && room.area >= 25).sort((first, second) => lightWeight(second) - lightWeight(first)).slice(0, plan.maxRoomLights ?? 10);
  // The largest rooms get shadowed lights so light stops at walls instead of leaking into neighbors.
  for (const [index, room] of lightRooms.entries()) {
    const light = new THREE.PointLight(plan.roomLightColor ?? '#ffe4c6', ((plan.roomLightIntensity ?? 14) + room.area * 0.42) * (room.lightScale ?? 1), 0, 2);
    light.position.set(room.centroid.x, ceilingHeight - 1.5, room.centroid.z);
    if (index < (plan.shadowedRoomLights ?? 6)) {
      light.castShadow = true;
      light.shadow.mapSize.set(highQuality ? 1024 : 512, highQuality ? 1024 : 512);
      light.shadow.bias = -0.004;
      light.shadow.camera.near = 0.3;
      light.shadow.camera.far = 60;
    }
    scene.add(light);
  }

  const camera = new THREE.PerspectiveCamera(OVERVIEW_FOV, 1, 0.25, 900);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  const aoPass = new GTAOPass(scene, camera, 1, 1);
  aoPass.updateGtaoMaterial({ radius: 2.4, distanceExponent: 1.6, thickness: 1.4, scale: 1.35, samples: 16, distanceFallOff: 1 });
  aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  // Glass and sheer curtains would otherwise cast occlusion halos onto the frames behind them.
  const hideForOcclusion = aoPass.overrideVisibility.bind(aoPass);
  aoPass.overrideVisibility = () => {
    hideForOcclusion();
    scene.traverse((object) => {
      if (object.isMesh && object.material?.transparent) {
        object.visible = false;
      }
    });
  };
  composer.addPass(aoPass);
  composer.addPass(new OutputPass());
  const startRoom = rooms.find((room) => room.id === plan.startRoom) ?? rooms.find((room) => room.view);
  const state = {
    flight: null,
    joystick: { x: 0, y: 0 },
    keys: new Set(),
    mode: 'overview',
    needsRender: true,
    orbit: { azimuth: plan.overview?.azimuth ?? -0.42, polar: plan.overview?.polar ?? 0.74, radius: 60, target: planCenter.clone(), userZoomed: false },
    walker: { x: startRoom.view.at[0], z: startRoom.view.at[1], yaw: 0, pitch: -0.06, autopilot: null },
    currentRoom: null,
    quality: highQuality ? 'hd' : 'standard',
  };
  state.walker.yaw = yawToward(startRoom.view.at, startRoom.view.look);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  function yawToward([fromX, fromZ], [toX, toZ]) {
    return Math.atan2(-(toX - fromX), -(toZ - fromZ));
  }

  function fitRadius() {
    const verticalHalf = THREE.MathUtils.degToRad(OVERVIEW_FOV / 2);
    const horizontalHalf = Math.atan(Math.tan(verticalHalf) * camera.aspect);
    return (planRadius / Math.sin(Math.min(verticalHalf, horizontalHalf))) * 1.08;
  }

  function orbitPose() {
    const { azimuth, polar, radius, target } = state.orbit;
    const position = new THREE.Vector3(
      target.x + radius * Math.sin(polar) * Math.sin(azimuth),
      target.y + radius * Math.cos(polar),
      target.z + radius * Math.sin(polar) * Math.cos(azimuth),
    );
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(position, target, UP));
    return { position, quaternion, fov: OVERVIEW_FOV };
  }

  function walkerPose() {
    const { x, z, yaw, pitch } = state.walker;
    return {
      position: new THREE.Vector3(x, EYE_HEIGHT, z),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')),
      fov: WALK_FOV,
    };
  }

  function applyPose(pose) {
    camera.position.copy(pose.position);
    camera.quaternion.copy(pose.quaternion);
    if (camera.fov !== pose.fov) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }
  }

  function flyTo(target, { duration = 1100, vertical = 'linear', onDone } = {}) {
    if (reducedMotion) {
      applyPose(target);
      onDone?.();
      state.needsRender = true;
      return;
    }

    state.flight = {
      from: { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov },
      to: target,
      start: performance.now(),
      duration,
      vertical,
      onDone,
    };
  }

  function updateFlight(now) {
    const flight = state.flight;
    const progress = Math.min(1, (now - flight.start) / flight.duration);
    const eased = easeInOutCubic(progress);
    const verticalProgress = flight.vertical === 'late' ? eased ** 2.2 : flight.vertical === 'early' ? 1 - (1 - eased) ** 2.2 : eased;
    camera.position.x = THREE.MathUtils.lerp(flight.from.position.x, flight.to.position.x, eased);
    camera.position.z = THREE.MathUtils.lerp(flight.from.position.z, flight.to.position.z, eased);
    camera.position.y = THREE.MathUtils.lerp(flight.from.position.y, flight.to.position.y, verticalProgress);
    camera.quaternion.slerpQuaternions(flight.from.quaternion, flight.to.quaternion, eased);
    camera.fov = THREE.MathUtils.lerp(flight.from.fov, flight.to.fov, eased);
    camera.updateProjectionMatrix();

    if (progress >= 1) {
      state.flight = null;
      flight.onDone?.();
    }
  }

  function setCeilingsVisible(visible) {
    ceilingGroup.visible = visible;
    renderer.shadowMap.needsUpdate = true;
  }

  function setMode(mode) {
    if (mode === state.mode && !state.flight) {
      return;
    }

    state.mode = mode;
    elements.modeOverview.setAttribute('aria-pressed', String(mode === 'overview'));
    elements.modeWalk.setAttribute('aria-pressed', String(mode === 'walk'));
    elements.tour.dataset.mode = mode;
    elements.minimap.hidden = mode !== 'walk';
    elements.joystick.hidden = !(mode === 'walk' && coarsePointer);
    updateHint();
    updateCurrentRoom();

    if (mode === 'overview') {
      state.walker.autopilot = null;
      setCeilingsVisible(false);
      flyTo(orbitPose(), { duration: 1300, vertical: 'early' });
    } else {
      flyTo(walkerPose(), { duration: 1400, vertical: 'late', onDone: () => setCeilingsVisible(true) });
    }
  }

  function goToRoom(room) {
    if (!room.view) {
      return;
    }

    state.walker.x = room.view.at[0];
    state.walker.z = room.view.at[1];
    state.walker.yaw = yawToward(room.view.at, room.view.look);
    state.walker.pitch = room.view.pitch ?? -0.06;
    state.walker.autopilot = null;

    if (state.mode === 'overview') {
      setMode('walk');
    } else {
      flyTo(walkerPose(), { duration: 900 });
    }
  }

  function updateHint() {
    const HINTS = {
      overview: coarsePointer ? 'Drag to orbit. Pinch to zoom. Tap a room to step inside.' : 'Drag to orbit. Scroll to zoom. Click a room to step inside.',
      walk: coarsePointer ? 'Drag to look around. Use the stick to walk, or tap the floor.' : 'Drag to look around. Walk with W A S D or the arrow keys, or click the floor.',
    };
    elements.hint.textContent = HINTS[state.mode];
  }

  function resolveCollisions(position) {
    for (let iteration = 0; iteration < 3; iteration++) {
      for (const collider of world.colliders) {
        if (collider.staging && !world.furnishings.visible) {
          continue;
        }

        const offsetX = position.x - collider.x;
        const offsetZ = position.z - collider.z;
        const cosine = Math.cos(collider.angle);
        const sine = Math.sin(collider.angle);
        let localX = offsetX * cosine - offsetZ * sine;
        let localZ = offsetX * sine + offsetZ * cosine;
        const nearestX = clamp(localX, -collider.halfWidth, collider.halfWidth);
        const nearestZ = clamp(localZ, -collider.halfDepth, collider.halfDepth);
        const separationX = localX - nearestX;
        const separationZ = localZ - nearestZ;
        const distance = Math.hypot(separationX, separationZ);

        if (distance >= PLAYER_RADIUS) {
          continue;
        }

        if (distance < 1e-6) {
          const penetrationX = collider.halfWidth - Math.abs(localX);
          const penetrationZ = collider.halfDepth - Math.abs(localZ);
          if (penetrationX < penetrationZ) {
            localX += (Math.sign(localX) || 1) * (penetrationX + PLAYER_RADIUS);
          } else {
            localZ += (Math.sign(localZ) || 1) * (penetrationZ + PLAYER_RADIUS);
          }
        } else {
          const push = PLAYER_RADIUS - distance;
          localX += (separationX / distance) * push;
          localZ += (separationZ / distance) * push;
        }

        position.x = collider.x + localX * cosine + localZ * sine;
        position.z = collider.z - localX * sine + localZ * cosine;
      }
    }
  }

  function updateWalker(delta) {
    const walker = state.walker;
    const keys = state.keys;
    const forwardInput = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + state.joystick.y;
    const strafeInput = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + state.joystick.x;
    const turnInput = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
    walker.yaw += turnInput * TURN_SPEED * delta;
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;
    const position = { x: walker.x, z: walker.z };
    let moved = turnInput !== 0;

    if (forwardInput !== 0 || strafeInput !== 0) {
      walker.autopilot = null;
      let moveX = -Math.sin(walker.yaw) * forwardInput + Math.cos(walker.yaw) * strafeInput;
      let moveZ = -Math.cos(walker.yaw) * forwardInput - Math.sin(walker.yaw) * strafeInput;
      const magnitude = Math.hypot(moveX, moveZ);
      if (magnitude > 1) {
        moveX /= magnitude;
        moveZ /= magnitude;
      }
      position.x += moveX * speed * delta;
      position.z += moveZ * speed * delta;
      moved = true;
    } else if (walker.autopilot) {
      const target = walker.autopilot;
      const remainingX = target.x - position.x;
      const remainingZ = target.z - position.z;
      const remaining = Math.hypot(remainingX, remainingZ);
      if (remaining < 0.25) {
        walker.autopilot = null;
        return;
      }
      const step = Math.min(remaining, WALK_SPEED * 1.15 * delta);
      position.x += (remainingX / remaining) * step;
      position.z += (remainingZ / remaining) * step;
      target.elapsed += delta;
      moved = true;
      if (remaining < 0.25 || target.elapsed > target.limit) {
        walker.autopilot = null;
      }
    }

    if (moved) {
      resolveCollisions(position);
      walker.x = position.x;
      walker.z = position.z;
      state.needsRender = true;
    }
  }

  function updateCurrentRoom() {
    // Standing at a room's preset spot counts as that room, even when the spot sits in a neighbor's floor area.
    const presetRoom = rooms.find((candidate) => candidate.view && Math.hypot(candidate.view.at[0] - state.walker.x, candidate.view.at[1] - state.walker.z) < 0.6);
    const room = presetRoom ?? rooms.find((candidate) => pointInPolygon(state.walker.x, state.walker.z, candidate.polygon));
    const roomId = state.mode === 'walk' ? room?.id ?? null : null;

    if (roomId === state.currentRoom) {
      return;
    }

    state.currentRoom = roomId;
    for (const chip of elements.chips.querySelectorAll('button')) {
      const chipRooms = chip.dataset.rooms.split(' ');
      if (chipRooms.includes(roomId)) {
        chip.setAttribute('aria-current', 'location');
      } else {
        chip.removeAttribute('aria-current');
      }
    }
  }

  const labelEntries = [];
  for (const room of rooms) {
    if (room.label === false) {
      continue;
    }

    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'room-label';
    label.innerHTML = `<span class="room-label-name"></span>${room.dimensions ? '<span class="room-label-size"></span>' : ''}`;
    label.querySelector('.room-label-name').textContent = room.name;
    if (room.dimensions) {
      label.querySelector('.room-label-size').textContent = room.dimensions;
    }
    label.tabIndex = room.view ? 0 : -1;
    label.addEventListener('click', () => goToRoom(room));
    elements.labels.appendChild(label);
    labelEntries.push({ label, anchor: new THREE.Vector3(room.centroid.x, 0.6, room.centroid.z) });
  }

  const projected = new THREE.Vector3();
  function updateLabels() {
    const width = elements.canvas.clientWidth;
    const height = elements.canvas.clientHeight;
    for (const { label, anchor } of labelEntries) {
      projected.copy(anchor).project(camera);
      label.style.transform = `translate(${((projected.x + 1) / 2) * width}px, ${((1 - projected.y) / 2) * height}px) translate(-50%, -50%)`;
    }
  }

  const chipGroups = new Map();
  for (const room of rooms) {
    if (!room.view || room.chip === false) {
      continue;
    }
    const chipName = room.chipName ?? room.name;
    if (!chipGroups.has(chipName)) {
      chipGroups.set(chipName, { room, ids: [] });
    }
    chipGroups.get(chipName).ids.push(room.id, ...(room.alsoCovers ?? []));
  }
  for (const [chipName, { room, ids }] of chipGroups) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'room-chip';
    chip.textContent = chipName;
    chip.dataset.rooms = ids.join(' ');
    chip.addEventListener('click', () => goToRoom(room));
    elements.chips.appendChild(chip);
  }

  const finishSelections = {};
  function applyFinish(option) {
    if (option.cabinet) {
      materials.cabinet.color.set(option.cabinet);
      materials.cabinetDoor.color.set(option.cabinet);
    }
    if (option.counter) {
      replaceMap(materials.counter, counterTexture(option.counter));
    }
    if (option.wood) {
      replaceMap(materials.floorWood, woodPlankTexture(option.wood));
    }
    if (option.paint) {
      materials.paint.color.set(option.paint);
    }
    if (option.carpet) {
      replaceMap(materials.carpet, carpetTexture({ rgb: option.carpet }));
    }
    state.needsRender = true;
  }

  function replaceMap(material, texture) {
    material.map.dispose();
    material.map = texture;
    if (material.bumpMap) {
      material.bumpMap = texture;
    }
    material.needsUpdate = true;
  }

  for (const group of plan.finishes ?? []) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'finish-group';
    const legend = document.createElement('legend');
    legend.textContent = group.label;
    const current = document.createElement('span');
    current.className = 'finish-current';
    legend.append(' ', current);
    fieldset.appendChild(legend);
    const swatches = document.createElement('div');
    swatches.className = 'swatches';
    swatches.setAttribute('role', 'radiogroup');
    swatches.setAttribute('aria-label', group.label);
    fieldset.appendChild(swatches);

    for (const option of group.options) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch';
      swatch.setAttribute('role', 'radio');
      swatch.setAttribute('aria-label', option.label);
      swatch.title = option.label;
      swatch.style.setProperty('--swatch', option.swatch);
      swatch.addEventListener('click', () => {
        finishSelections[group.id] = option.id;
        for (const sibling of swatches.children) {
          sibling.setAttribute('aria-checked', String(sibling === swatch));
        }
        current.textContent = option.label;
        applyFinish(option);
      });
      swatches.appendChild(swatch);
    }

    const defaultOption = group.options[0];
    finishSelections[group.id] = defaultOption.id;
    applyFinish(defaultOption);
    swatches.children[0].setAttribute('aria-checked', 'true');
    for (const sibling of [...swatches.children].slice(1)) {
      sibling.setAttribute('aria-checked', 'false');
    }
    current.textContent = defaultOption.label;
    elements.finishes.appendChild(fieldset);
  }

  elements.finishesToggle.hidden = !(plan.finishes?.length);
  elements.finishesToggle.addEventListener('click', () => {
    const open = elements.finishes.hidden;
    elements.finishes.hidden = !open;
    elements.finishesToggle.setAttribute('aria-expanded', String(open));
  });

  elements.stagingToggle.hidden = world.furnishings.children.length === 0;
  elements.stagingToggle.addEventListener('click', () => {
    world.furnishings.visible = !world.furnishings.visible;
    elements.stagingToggle.setAttribute('aria-pressed', String(world.furnishings.visible));
    elements.stagingToggle.textContent = world.furnishings.visible ? 'Furnished' : 'Empty';
    renderer.shadowMap.needsUpdate = true;
    state.needsRender = true;
  });

  elements.modeOverview.addEventListener('click', () => setMode('overview'));
  elements.modeWalk.addEventListener('click', () => setMode('walk'));

  const minimapContext = elements.minimap.getContext('2d');
  const minimapBase = document.createElement('canvas');
  const MINIMAP_PADDING = 10;
  const minimapScale = Math.min(
    (elements.minimap.width - MINIMAP_PADDING * 2) / (bounds.maxX - bounds.minX),
    (elements.minimap.height - MINIMAP_PADDING * 2) / (bounds.maxZ - bounds.minZ),
  );
  const minimapOffsetX = (elements.minimap.width - (bounds.maxX - bounds.minX) * minimapScale) / 2;
  const minimapOffsetY = (elements.minimap.height - (bounds.maxZ - bounds.minZ) * minimapScale) / 2;
  const toMinimap = (x, z) => [minimapOffsetX + (x - bounds.minX) * minimapScale, minimapOffsetY + (z - bounds.minZ) * minimapScale];
  const fromMinimap = (pixelX, pixelY) => [(pixelX - minimapOffsetX) / minimapScale + bounds.minX, (pixelY - minimapOffsetY) / minimapScale + bounds.minZ];

  function drawMinimapBase() {
    const styles = getComputedStyle(elements.tour);
    const token = (name) => styles.getPropertyValue(name).trim();
    minimapBase.width = elements.minimap.width;
    minimapBase.height = elements.minimap.height;
    const context = minimapBase.getContext('2d');
    for (const room of rooms) {
      context.beginPath();
      room.polygon.forEach(([x, z], index) => {
        const [pixelX, pixelY] = toMinimap(x, z);
        if (index === 0) {
          context.moveTo(pixelX, pixelY);
        } else {
          context.lineTo(pixelX, pixelY);
        }
      });
      context.closePath();
      context.fillStyle = room.outdoor ? token('--map-outdoor') : token('--map-room');
      context.fill();
    }
    context.strokeStyle = token('--map-wall');
    context.lineCap = 'square';
    for (const wall of plan.walls) {
      const segments = [];
      const length = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
      let cursor = 0;
      for (const opening of [...(wall.openings ?? [])].sort((first, second) => first.at - second.at)) {
        if (opening.kind === 'window') {
          continue;
        }
        segments.push([cursor, opening.at]);
        cursor = opening.at + opening.width;
      }
      segments.push([cursor, length]);
      context.lineWidth = (wall.exterior ? 0.55 : 0.4) * minimapScale;
      for (const [from, to] of segments) {
        const [startX, startY] = toMinimap(wall.from[0] + ((wall.to[0] - wall.from[0]) * from) / length, wall.from[1] + ((wall.to[1] - wall.from[1]) * from) / length);
        const [endX, endY] = toMinimap(wall.from[0] + ((wall.to[0] - wall.from[0]) * to) / length, wall.from[1] + ((wall.to[1] - wall.from[1]) * to) / length);
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
      }
    }
  }

  function drawMinimap() {
    const styles = getComputedStyle(elements.tour);
    minimapContext.clearRect(0, 0, elements.minimap.width, elements.minimap.height);
    minimapContext.drawImage(minimapBase, 0, 0);
    const [pixelX, pixelY] = toMinimap(state.walker.x, state.walker.z);
    const yaw = state.walker.yaw;
    minimapContext.save();
    minimapContext.translate(pixelX, pixelY);
    minimapContext.rotate(-yaw);
    minimapContext.fillStyle = styles.getPropertyValue('--map-cone').trim();
    minimapContext.beginPath();
    minimapContext.moveTo(0, 0);
    minimapContext.arc(0, 0, 34, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55);
    minimapContext.closePath();
    minimapContext.fill();
    minimapContext.fillStyle = styles.getPropertyValue('--accent').trim();
    minimapContext.beginPath();
    minimapContext.arc(0, 0, 5, 0, Math.PI * 2);
    minimapContext.fill();
    minimapContext.restore();
  }

  drawMinimapBase();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    drawMinimapBase();
    state.needsRender = true;
  });

  elements.minimap.addEventListener('click', (event) => {
    const box = elements.minimap.getBoundingClientRect();
    const [x, z] = fromMinimap(((event.clientX - box.left) / box.width) * elements.minimap.width, ((event.clientY - box.top) / box.height) * elements.minimap.height);
    if (rooms.some((room) => pointInPolygon(x, z, room.polygon))) {
      const position = { x, z };
      resolveCollisions(position);
      state.walker.x = position.x;
      state.walker.z = position.z;
      state.walker.autopilot = null;
      flyTo(walkerPose(), { duration: 700 });
    }
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function handleTap(clientX, clientY) {
    const box = elements.canvas.getBoundingClientRect();
    pointer.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);

    if (state.mode === 'overview') {
      const hit = raycaster.intersectObjects(floorMeshes, false)[0];
      if (hit?.object.userData.room) {
        const room = hit.object.userData.room;
        if (room.view) {
          goToRoom(room);
        } else {
          const position = { x: hit.point.x, z: hit.point.z };
          resolveCollisions(position);
          state.walker.x = position.x;
          state.walker.z = position.z;
          setMode('walk');
        }
      }
      return;
    }

    const hits = raycaster.intersectObjects([...world.root.children, ...(world.furnishings.visible ? world.furnishings.children : [])], true);
    const hit = hits.find((candidate) => !candidate.object.material.transparent);
    if (hit?.object.userData.room) {
      const distance = Math.hypot(hit.point.x - state.walker.x, hit.point.z - state.walker.z);
      state.walker.autopilot = { x: hit.point.x, z: hit.point.z, elapsed: 0, limit: distance / WALK_SPEED + 1.5 };
    }
  }

  const pointers = new Map();
  let pinch = null;
  elements.canvas.addEventListener('pointerdown', (event) => {
    elements.canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, startTime: performance.now() });
    if (pointers.size === 2) {
      const [first, second] = [...pointers.values()];
      pinch = { distance: Math.hypot(first.x - second.x, first.y - second.y), radius: state.orbit.radius };
    }
  });

  elements.canvas.addEventListener('pointermove', (event) => {
    const tracked = pointers.get(event.pointerId);
    if (!tracked || state.flight) {
      return;
    }

    const deltaX = event.clientX - tracked.x;
    const deltaY = event.clientY - tracked.y;
    tracked.x = event.clientX;
    tracked.y = event.clientY;

    if (pointers.size === 2 && pinch && state.mode === 'overview') {
      const [first, second] = [...pointers.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      state.orbit.radius = clamp((pinch.radius * pinch.distance) / Math.max(distance, 1), 18, 160);
      state.orbit.userZoomed = true;
      state.needsRender = true;
      return;
    }

    if (pointers.size !== 1) {
      return;
    }

    if (state.mode === 'overview') {
      state.orbit.azimuth -= deltaX * 0.006;
      state.orbit.polar = clamp(state.orbit.polar - deltaY * 0.005, 0.12, 1.3);
    } else {
      state.walker.yaw += deltaX * LOOK_SPEED;
      state.walker.pitch = clamp(state.walker.pitch + deltaY * LOOK_SPEED, -1.2, 1.2);
    }
    state.needsRender = true;
  });

  function releasePointer(event) {
    const tracked = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinch = null;
    }

    if (event.type === 'pointerup' && tracked && pointers.size === 0) {
      const travel = Math.hypot(event.clientX - tracked.startX, event.clientY - tracked.startY);
      if (travel < 8 && performance.now() - tracked.startTime < 450) {
        handleTap(event.clientX, event.clientY);
      }
    }
  }
  elements.canvas.addEventListener('pointerup', releasePointer);
  elements.canvas.addEventListener('pointercancel', releasePointer);

  elements.canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (state.mode === 'overview' && !state.flight) {
      state.orbit.radius = clamp(state.orbit.radius * (1 + event.deltaY * 0.0012), 18, 160);
      state.orbit.userZoomed = true;
      state.needsRender = true;
    }
  }, { passive: false });

  const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
  window.addEventListener('keydown', (event) => {
    if (!MOVEMENT_KEYS.has(event.code) || event.target.closest?.('input, textarea, select')) {
      return;
    }

    if (state.mode === 'overview' && event.code.startsWith('Key')) {
      setMode('walk');
    }

    if (state.mode === 'walk') {
      event.preventDefault();
      state.keys.add(event.code);
    }
  });
  window.addEventListener('keyup', (event) => state.keys.delete(event.code));
  window.addEventListener('blur', () => state.keys.clear());

  const knob = elements.joystick.querySelector('.joystick-knob');
  let joystickPointer = null;
  function moveJoystick(event) {
    const box = elements.joystick.getBoundingClientRect();
    const radius = box.width / 2;
    let offsetX = event.clientX - (box.left + radius);
    let offsetY = event.clientY - (box.top + radius);
    const distance = Math.hypot(offsetX, offsetY);
    if (distance > radius) {
      offsetX = (offsetX / distance) * radius;
      offsetY = (offsetY / distance) * radius;
    }
    knob.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    state.joystick.x = offsetX / radius;
    state.joystick.y = -offsetY / radius;
  }
  elements.joystick.addEventListener('pointerdown', (event) => {
    joystickPointer = event.pointerId;
    elements.joystick.setPointerCapture(event.pointerId);
    moveJoystick(event);
  });
  elements.joystick.addEventListener('pointermove', (event) => {
    if (event.pointerId === joystickPointer) {
      moveJoystick(event);
    }
  });
  function releaseJoystick() {
    joystickPointer = null;
    knob.style.transform = '';
    state.joystick.x = 0;
    state.joystick.y = 0;
  }
  elements.joystick.addEventListener('pointerup', releaseJoystick);
  elements.joystick.addEventListener('pointercancel', releaseJoystick);

  function renderFrame() {
    if (state.quality === 'hd') {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  function applySize(pixelRatio) {
    const width = elements.canvas.clientWidth;
    const height = elements.canvas.clientHeight;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
  }

  function resize() {
    const width = elements.canvas.clientWidth;
    const height = elements.canvas.clientHeight;
    applySize(Math.min(window.devicePixelRatio, 2));
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    if (!state.orbit.userZoomed) {
      state.orbit.radius = fitRadius();
    }
    if (state.mode === 'overview' && !state.flight) {
      applyPose(orbitPose());
    }
    state.needsRender = true;
  }
  new ResizeObserver(resize).observe(elements.canvas);
  resize();

  setCeilingsVisible(false);
  elements.tour.dataset.mode = 'overview';
  updateHint();
  applyPose(orbitPose());

  let lastTime = performance.now();
  function frame(now) {
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    let active = false;

    if (state.flight) {
      updateFlight(now);
      active = true;
    } else if (state.mode === 'walk') {
      updateWalker(delta);
      applyPose(walkerPose());
      active = true;
    } else {
      applyPose(orbitPose());
    }

    if (state.mode === 'walk' && !reducedMotion) {
      for (const rotor of world.spinners) {
        rotor.rotation.y += delta * 1.4;
      }
    }

    if (active || state.needsRender) {
      renderFrame();
      state.needsRender = false;
      if (state.mode === 'overview' || state.flight) {
        updateLabels();
      }
      if (state.mode === 'walk') {
        updateCurrentRoom();
        drawMinimap();
      }
    }

    requestAnimationFrame(frame);
  }

  // Bake each mirror's reflection once from its own position; the scene is static.
  ceilingGroup.visible = true;
  for (const mirror of world.mirrors) {
    const target = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cubeCamera = new THREE.CubeCamera(0.3, 200, target);
    cubeCamera.position.copy(mirror.position);
    scene.add(cubeCamera);
    renderer.shadowMap.needsUpdate = true;
    cubeCamera.update(renderer, scene);
    mirror.material.envMap = target.texture;
    mirror.material.needsUpdate = true;
  }
  ceilingGroup.visible = false;

  elements.qualityToggle.setAttribute('aria-pressed', String(state.quality === 'hd'));
  elements.qualityToggle.addEventListener('click', () => {
    state.quality = state.quality === 'hd' ? 'standard' : 'hd';
    elements.qualityToggle.setAttribute('aria-pressed', String(state.quality === 'hd'));
    state.needsRender = true;
  });

  // The artifact viewer blocks downloads, so the photo button only appears on a standalone page.
  elements.photoButton.hidden = window.self !== window.top;
  elements.photoButton.addEventListener('click', () => {
    const quality = state.quality;
    state.quality = 'hd';
    applySize(3);
    renderer.shadowMap.needsUpdate = true;
    renderFrame();
    elements.canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const roomName = rooms.find((room) => room.id === state.currentRoom)?.name ?? (state.mode === 'overview' ? 'overview' : 'view');
      link.download = `${plan.name} ${roomName}.png`.replace(/\s+/g, '-').toLowerCase();
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    }, 'image/png');
    state.quality = quality;
    resize();
  });

  renderer.shadowMap.needsUpdate = true;
  renderFrame();
  updateLabels();
  elements.loading.hidden = true;
  requestAnimationFrame(frame);

  window.tourDebug = { aoPass, camera, composer, goToRoom, rooms, scene, setMode, state, renderer };
}
