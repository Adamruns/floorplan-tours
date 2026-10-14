// Furniture and fixture library. Every builder works in feet with the footprint centered on the
// local origin, the floor at y = 0 and the front of the piece facing +z. kit.add() places it.

const FACING_ANGLES = { south: 0, east: Math.PI / 2, north: Math.PI, west: -Math.PI / 2 };

// Built-in pieces that stay when a viewer switches the tour to an empty, unstaged house.
const FIXTURE_TYPES = new Set([
  'airHandler', 'baseRun', 'canLight', 'ceilingFan', 'chandelier', 'closetSystem', 'column', 'cooktop', 'counterSlab',
  'fireplace', 'flushLight', 'fridge', 'kitchenSink', 'microwave', 'mirror', 'pendant', 'railing', 'range', 'rangeHood',
  'showerStall', 'toilet', 'towelBar', 'trackLight', 'tree', 'tub', 'upperRun', 'vanity', 'vanityLight', 'wallOvens',
  'washerDryer', 'waterHeater',
]);

function facingAngle(facing) {
  if (typeof facing === 'number') {
    return (facing * Math.PI) / 180;
  }

  return FACING_ANGLES[facing] ?? 0;
}

// Rewrites BoxGeometry UVs so tiled textures keep a constant real-world scale on any box size.
function setBoxUVsInFeet(geometry, width, height, depth) {
  const uv = geometry.attributes.uv;
  const FACE_SIZES = [
    [depth, height],
    [depth, height],
    [width, depth],
    [width, depth],
    [width, height],
    [width, height],
  ];
  for (let face = 0; face < 6; face++) {
    const [sizeU, sizeV] = FACE_SIZES[face];
    for (let vertex = 0; vertex < 4; vertex++) {
      const index = face * 4 + vertex;
      uv.setXY(index, uv.getX(index) * sizeU, uv.getY(index) * sizeV);
    }
  }
  uv.needsUpdate = true;
}

// Projects UVs from local position along each vertex's dominant normal axis, in feet, so tiled
// textures keep their real-world scale on rounded boxes.
function setProjectedUVs(geometry) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  for (let index = 0; index < position.count; index++) {
    const normalX = Math.abs(normal.getX(index));
    const normalY = Math.abs(normal.getY(index));
    const normalZ = Math.abs(normal.getZ(index));
    if (normalX >= normalY && normalX >= normalZ) {
      uv.setXY(index, position.getZ(index), position.getY(index));
    } else if (normalY >= normalZ) {
      uv.setXY(index, position.getX(index), position.getZ(index));
    } else {
      uv.setXY(index, position.getX(index), position.getY(index));
    }
  }
  uv.needsUpdate = true;
}

function createKit(world) {
  const solidCache = new Map();
  const fabricCache = new Map();

  function solid(color, { roughness = 0.8, metalness = 0, emissive = null, emissiveIntensity = 1, opacity = null, doubleSided = false } = {}) {
    const key = [color, roughness, metalness, emissive, emissiveIntensity, opacity, doubleSided].join('|');
    if (!solidCache.has(key)) {
      const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
      if (emissive) {
        material.emissive = new THREE.Color(emissive);
        material.emissiveIntensity = emissiveIntensity;
      }
      if (opacity !== null) {
        material.transparent = true;
        material.opacity = opacity;
        material.depthWrite = false;
      }
      if (doubleSided) {
        material.side = THREE.DoubleSide;
      }
      solidCache.set(key, material);
    }
    return solidCache.get(key);
  }

  function fabric(color, roughness = 0.95) {
    const key = `${color}|${roughness}`;
    if (!fabricCache.has(key)) {
      const material = new THREE.MeshStandardMaterial({ color, roughness, map: world.textures.fabric, bumpMap: world.textures.fabric, bumpScale: 0.6 });
      material.userData.tiled = true;
      material.userData.soft = true;
      fabricCache.set(key, material);
    }
    return fabricCache.get(key);
  }

  function resolveMaterial(material) {
    if (typeof material === 'string') {
      return world.materials[material] ?? solid(material);
    }

    return material;
  }

  // Upholstery gets soft rounded edges and hard surfaces get a small bevel, so edges catch light.
  function box(parent, { width, height, depth, x = 0, y = 0, z = 0, material, rotationX = 0, rotationY = 0, rotationZ = 0, castShadow = true, radius }) {
    const resolved = resolveMaterial(material);
    const smallest = Math.min(width, height, depth);
    const requested = radius ?? (resolved.userData?.soft ? Math.min(0.16, smallest * 0.32) : resolved.userData?.bevel ?? 0);
    const edgeRadius = Math.min(requested, smallest / 2 - 0.002);
    let geometry;

    if (edgeRadius > 0.005) {
      geometry = new RoundedBoxGeometry(width, height, depth, edgeRadius > 0.06 ? 3 : 2, edgeRadius);
      if (resolved.userData?.tiled) {
        setProjectedUVs(geometry);
      }
    } else {
      geometry = new THREE.BoxGeometry(width, height, depth);
      if (resolved.userData?.tiled) {
        setBoxUVsInFeet(geometry, width, height, depth);
      }
    }

    const instance = new THREE.Mesh(geometry, resolved);
    instance.position.set(x, y + height / 2, z);
    instance.rotation.set(rotationX, rotationY, rotationZ);
    instance.castShadow = castShadow && !resolved.transparent;
    instance.receiveShadow = true;
    parent.add(instance);
    return instance;
  }

  function cylinder(parent, { radius = 0.5, radiusTop = radius, radiusBottom = radius, height, x = 0, y = 0, z = 0, material, segments = 24, rotationX = 0, rotationZ = 0, scaleX = 1, scaleZ = 1, castShadow = true, openEnded = false }) {
    const resolved = resolveMaterial(material);
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, openEnded);
    const instance = new THREE.Mesh(geometry, resolved);
    instance.position.set(x, y + height / 2, z);
    instance.rotation.set(rotationX, 0, rotationZ);
    instance.scale.set(scaleX, 1, scaleZ);
    instance.castShadow = castShadow && !resolved.transparent;
    instance.receiveShadow = true;
    parent.add(instance);
    return instance;
  }

  function sphere(parent, { radius, x = 0, y = 0, z = 0, material, scaleX = 1, scaleY = 1, scaleZ = 1, detail = 1, castShadow = true }) {
    const resolved = resolveMaterial(material);
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const instance = new THREE.Mesh(geometry, resolved);
    instance.position.set(x, y, z);
    instance.scale.set(scaleX, scaleY, scaleZ);
    instance.castShadow = castShadow;
    instance.receiveShadow = true;
    parent.add(instance);
    return instance;
  }

  function addCollider(x, z, width, depth, angle = 0, staging = false) {
    world.colliders.push({ x, z, halfWidth: width / 2, halfDepth: depth / 2, angle, staging });
  }

  function add(type, options) {
    const builder = FURNITURE[type];

    if (!builder) {
      throw new Error(`Unknown furniture type: ${type}`);
    }

    const built = builder(kit, options);
    const angle = facingAngle(options.facing ?? 'south');
    built.group.position.set(options.x, options.y ?? 0, options.z);
    built.group.rotation.y = angle;
    const isFixture = options.fixture ?? FIXTURE_TYPES.has(type);
    (isFixture ? world.root : world.furnishings).add(built.group);

    if (built.collide !== false && options.collide !== false && built.width && built.depth) {
      addCollider(options.x, options.z, built.width + (built.clearance ?? 0), built.depth + (built.clearance ?? 0), angle, !isFixture);
    }

    return built.group;
  }

  const kit = { add, addCollider, box, cylinder, sphere, solid, fabric, resolveMaterial, world };
  return kit;
}

function legsAtCorners(kit, group, { width, depth, height, inset = 0.15, radius = 0.06, material, y = 0 }) {
  for (const signX of [-1, 1]) {
    for (const signZ of [-1, 1]) {
      kit.cylinder(group, { radius, height, x: signX * (width / 2 - inset), z: signZ * (depth / 2 - inset), y, material, segments: 10 });
    }
  }
}

function doorFronts(kit, group, { from, to, frontZ, bottom, top, drawerHeight = 0.5, material = 'cabinetDoor', pulls = true }) {
  const length = to - from;
  const count = Math.max(1, Math.round(length / 1.6));
  const unit = length / count;
  for (let index = 0; index < count; index++) {
    const centerX = from + unit * (index + 0.5);
    if (drawerHeight > 0) {
      kit.box(group, { width: unit - 0.03, height: drawerHeight - 0.03, depth: 0.06, x: centerX, y: top - drawerHeight + 0.015, z: frontZ, material });
      if (pulls) {
        kit.box(group, { width: Math.min(0.5, unit * 0.4), height: 0.035, depth: 0.05, x: centerX, y: top - drawerHeight / 2, z: frontZ + 0.06, material: 'stainless' });
      }
    }
    const doorTop = top - drawerHeight;
    kit.box(group, { width: unit - 0.03, height: doorTop - bottom - 0.03, depth: 0.06, x: centerX, y: bottom + 0.015, z: frontZ, material });
    if (pulls) {
      const pullX = centerX + (index % 2 === 0 ? 1 : -1) * (unit / 2 - 0.16);
      kit.box(group, { width: 0.035, height: 0.42, depth: 0.05, x: pullX, y: doorTop - 0.62, z: frontZ + 0.06, material: 'stainless' });
    }
  }
}

function sheerPanel(kit, { width, height, folds = 7, depth = 0.18, material }) {
  const segmentsAcross = folds * 6;
  const geometry = new THREE.PlaneGeometry(width, height, segmentsAcross, 1);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index++) {
    const localX = positions.getX(index);
    positions.setZ(index, Math.sin(((localX / width) + 0.5) * folds * Math.PI * 2) * depth);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, kit.resolveMaterial(material));
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

const FURNITURE = {
  sofa(kit, { length = 7, depth = 3.1, fabric = '#a9acaa', pillows = ['#1f4e5f', '#2f7383', '#e4ddcf'], legs = '#b28f58' }) {
    const group = new THREE.Group();
    const upholstery = kit.fabric(fabric);
    const armWidth = 0.55;
    const backDepth = 0.75;
    const seatDepth = depth - backDepth;
    legsAtCorners(kit, group, { width: length, depth, height: 0.36, material: kit.solid(legs, { roughness: 0.35, metalness: 0.7 }) });
    kit.box(group, { width: length, height: 0.72, depth, y: 0.36, material: upholstery });
    kit.box(group, { width: length - armWidth * 2, height: 1.35, depth: backDepth, y: 1.05, z: -depth / 2 + backDepth / 2, material: upholstery });

    for (const side of [-1, 1]) {
      kit.box(group, { width: armWidth, height: 1.0, depth, x: side * (length / 2 - armWidth / 2), y: 1.05, material: upholstery });
    }

    const cushionCount = length > 5.5 ? 3 : 2;
    const cushionWidth = (length - armWidth * 2) / cushionCount;
    for (let index = 0; index < cushionCount; index++) {
      const centerX = -length / 2 + armWidth + cushionWidth * (index + 0.5);
      kit.box(group, { width: cushionWidth - 0.04, height: 0.42, depth: seatDepth - 0.05, x: centerX, y: 1.08, z: depth / 2 - seatDepth / 2, material: upholstery });
      kit.box(group, { width: cushionWidth - 0.06, height: 1.25, depth: 0.5, x: centerX, y: 1.45, z: -depth / 2 + backDepth + 0.15, rotationX: -0.18, material: upholstery });
    }

    pillows.forEach((color, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const step = Math.floor(index / 2);
      kit.box(group, { width: 1.3, height: 1.2, depth: 0.38, x: side * (length / 2 - armWidth - 0.72 - step * 0.85), y: 1.48, z: -depth / 2 + backDepth + 0.42 + step * 0.1, rotationX: -0.28, rotationZ: side * 0.05, material: kit.fabric(color) });
    });

    return { group, width: length, depth };
  },

  armchair(kit, { fabric = '#53704a', legs = '#a07b4f' }) {
    const group = new THREE.Group();
    const upholstery = kit.fabric(fabric, 0.7);
    const width = 2.6;
    const depth = 2.6;
    legsAtCorners(kit, group, { width, depth, height: 0.5, material: legs });
    kit.box(group, { width, height: 0.6, depth, y: 0.5, material: upholstery });
    kit.box(group, { width: width - 0.2, height: 1.5, depth: 0.45, y: 1.0, z: -depth / 2 + 0.3, rotationX: -0.12, material: upholstery });
    for (const side of [-1, 1]) {
      kit.box(group, { width: 0.4, height: 0.85, depth: depth - 0.3, x: side * (width / 2 - 0.2), y: 1.0, z: 0.1, material: upholstery });
    }
    kit.box(group, { width: width - 0.85, height: 0.3, depth: depth - 0.6, y: 1.1, z: 0.2, material: upholstery });
    return { group, width, depth };
  },

  coffeeTable(kit, { length = 4, width = 2, top = '#4a4440', frame = '#b8954f' }) {
    const group = new THREE.Group();
    const frameMaterial = kit.solid(frame, { roughness: 0.3, metalness: 0.8 });
    kit.box(group, { width: length, height: 0.1, depth: width, y: 1.4, material: kit.solid(top, { roughness: 0.45 }) });
    legsAtCorners(kit, group, { width: length, depth: width, height: 1.4, inset: 0.12, radius: 0.03, material: frameMaterial });
    kit.box(group, { width: length - 0.24, height: 0.04, depth: 0.04, y: 1.3, z: width / 2 - 0.12, material: frameMaterial });
    kit.box(group, { width: length - 0.24, height: 0.04, depth: 0.04, y: 1.3, z: -width / 2 + 0.12, material: frameMaterial });
    return { group, width: length, depth: width };
  },

  sideTable(kit, { size = 1.5, height = 2.0, top = '#d9d2c6', frame = '#b5935a', lamp = true }) {
    const group = new THREE.Group();
    kit.box(group, { width: size, height: 0.08, depth: size, y: height - 0.08, material: kit.solid(top, { roughness: 0.3 }) });
    kit.box(group, { width: size, height: 0.05, depth: size, y: 0.35, material: kit.solid(top, { roughness: 0.3 }) });
    legsAtCorners(kit, group, { width: size, depth: size, height: height - 0.08, inset: 0.05, radius: 0.025, material: kit.solid(frame, { roughness: 0.3, metalness: 0.8 }) });
    if (lamp) {
      FURNITURE.tableLamp(kit, { parent: group, y: height });
    }
    return { group, width: size, depth: size };
  },

  tableLamp(kit, { parent, y = 0, x = 0, z = 0, base = '#e8e2d6', shade = '#f5f1e8' }) {
    const group = parent ?? new THREE.Group();
    kit.cylinder(group, { radiusTop: 0.16, radiusBottom: 0.3, height: 1.15, x, y, z, material: kit.solid(base, { roughness: 0.25 }) });
    kit.cylinder(group, { radius: 0.02, height: 0.35, x, y: y + 1.15, z, material: 'stainless' });
    kit.cylinder(group, { radiusTop: 0.42, radiusBottom: 0.55, height: 0.8, x, y: y + 1.35, z, material: kit.solid(shade, { roughness: 0.9, emissive: '#ffe7c2', emissiveIntensity: 0.55, doubleSided: true }), openEnded: true, castShadow: false });
    return { group, collide: false };
  },

  floorLamp(kit, { finish = '#2b2b2b' }) {
    const group = new THREE.Group();
    const metal = kit.solid(finish, { roughness: 0.4, metalness: 0.6 });
    kit.cylinder(group, { radius: 0.5, height: 0.08, material: metal });
    kit.cylinder(group, { radius: 0.04, height: 5.0, material: metal });
    kit.cylinder(group, { radiusTop: 0.55, radiusBottom: 0.7, height: 0.9, y: 4.7, material: kit.solid('#f4efe4', { roughness: 0.9, emissive: '#ffe7c2', emissiveIntensity: 0.6, doubleSided: true }), openEnded: true, castShadow: false });
    return { group, width: 1, depth: 1 };
  },

  tvConsole(kit, { length = 5.5, depth = 1.5, color = '#cdbb9f', screen = 4.1 }) {
    const group = new THREE.Group();
    const body = kit.solid(color, { roughness: 0.55 });
    legsAtCorners(kit, group, { width: length, depth, height: 0.45, inset: 0.2, radius: 0.05, material: kit.solid('#2a2a2a', { roughness: 0.4, metalness: 0.6 }) });
    kit.box(group, { width: length, height: 1.3, depth, y: 0.45, material: body });
    const panelWidth = length / 3;
    for (let index = 0; index < 3; index++) {
      kit.box(group, { width: panelWidth - 0.04, height: 1.2, depth: 0.04, x: -length / 2 + panelWidth * (index + 0.5), y: 0.5, z: depth / 2, material: kit.solid(color, { roughness: 0.45 }) });
    }
    const screenHeight = screen * 0.5625;
    kit.box(group, { width: 1.0, height: 0.06, depth: 0.6, y: 1.75, material: '#1d1d1d' });
    kit.box(group, { width: 0.12, height: 0.35, depth: 0.12, y: 1.8, z: -0.1, material: '#1d1d1d' });
    kit.box(group, { width: screen, height: screenHeight, depth: 0.1, y: 2.1, z: -0.1, material: kit.solid('#0c0e11', { roughness: 0.12, metalness: 0.3 }) });
    return { group, width: length, depth };
  },

  rug(kit, { width = 8, length = 5, color = '#b9b6ae', border = null }) {
    const group = new THREE.Group();
    kit.box(group, { width, height: 0.03, depth: length, material: kit.fabric(color, 1), castShadow: false });
    if (border) {
      kit.box(group, { width: width - 0.6, height: 0.035, depth: length - 0.6, material: kit.fabric(border, 1), castShadow: false });
    }
    return { group, collide: false };
  },

  plant(kit, { height = 5, pot = '#ebe6dd', leaves = '#3f6b3a', seed = 3 }) {
    const group = new THREE.Group();
    const random = seededRandom(seed);
    kit.cylinder(group, { radiusTop: 0.62, radiusBottom: 0.48, height: 1.1, material: kit.solid(pot, { roughness: 0.5 }) });
    kit.cylinder(group, { radius: 0.05, height: height - 1.4, y: 1.0, material: '#5b4532' });
    const leafMaterial = kit.solid(leaves, { roughness: 0.65 });
    const leafCount = 16;
    for (let index = 0; index < leafCount; index++) {
      const angle = random() * Math.PI * 2;
      const reach = 0.25 + random() * 0.7;
      const leafY = 1.9 + (index / leafCount) * (height - 2.2);
      kit.sphere(group, { radius: 0.38, x: Math.cos(angle) * reach, y: leafY, z: Math.sin(angle) * reach, scaleX: 1.0, scaleY: 0.55, scaleZ: 0.35, material: leafMaterial, detail: 0 }).rotation.set(random(), angle, random() - 0.5);
    }
    return { group, width: 1.3, depth: 1.3 };
  },

  diningTableRound(kit, { diameter = 3.5, wood = '#a26b3f' }) {
    const group = new THREE.Group();
    const woodMaterial = kit.solid(wood, { roughness: 0.45 });
    kit.cylinder(group, { radius: diameter / 2, height: 0.05, y: 2.45, material: 'glass', segments: 48, castShadow: false });
    kit.cylinder(group, { radius: diameter / 2, height: 0.05, y: 2.45, material: kit.solid('#cfe0dd', { roughness: 0.05, opacity: 0.18 }), segments: 48, castShadow: false });
    for (let index = 0; index < 4; index++) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = kit.cylinder(group, { radiusTop: 0.07, radiusBottom: 0.05, height: 2.55, x: Math.cos(angle) * 0.55, z: Math.sin(angle) * 0.55, material: woodMaterial, segments: 10 });
      leg.rotation.set(Math.sin(angle) * 0.22, 0, -Math.cos(angle) * 0.22);
      leg.position.y = 1.22;
    }
    kit.cylinder(group, { radius: 0.5, height: 0.08, y: 2.3, material: woodMaterial });
    return { group, width: diameter + 1.4, depth: diameter + 1.4 };
  },

  diningTableRect(kit, { length = 5, width = 3, wood = '#8c6a4c' }) {
    const group = new THREE.Group();
    const woodMaterial = kit.solid(wood, { roughness: 0.5 });
    kit.box(group, { width: length, height: 0.14, depth: width, y: 2.36, material: woodMaterial });
    legsAtCorners(kit, group, { width: length, depth: width, height: 2.36, inset: 0.25, radius: 0.1, material: woodMaterial });
    return { group, width: length + 1.2, depth: width + 1.2 };
  },

  diningChair(kit, { fabric = '#cfcbc4', frame = '#3a3a3a' }) {
    const group = new THREE.Group();
    const frameMaterial = kit.solid(frame, { roughness: 0.4, metalness: 0.7 });
    const upholstery = kit.fabric(fabric, 0.85);
    legsAtCorners(kit, group, { width: 1.5, depth: 1.5, height: 1.45, inset: 0.1, radius: 0.03, material: frameMaterial });
    kit.box(group, { width: 1.55, height: 0.22, depth: 1.5, y: 1.45, material: upholstery });
    kit.box(group, { width: 1.5, height: 1.2, depth: 0.16, y: 1.75, z: -0.72, rotationX: -0.1, material: upholstery });
    return { group, width: 1.5, depth: 1.5, collide: false };
  },

  barStool(kit, { seat = '#ebe9e4', legs = '#a9794b' }) {
    const group = new THREE.Group();
    const legMaterial = kit.solid(legs, { roughness: 0.5 });
    for (let index = 0; index < 4; index++) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = kit.cylinder(group, { radius: 0.04, height: 2.25, x: Math.cos(angle) * 0.45, z: Math.sin(angle) * 0.45, material: legMaterial, segments: 8 });
      leg.rotation.set(-Math.sin(angle) * 0.1, 0, Math.cos(angle) * 0.1);
    }
    kit.cylinder(group, { radius: 0.4, height: 0.04, y: 0.8, material: legMaterial, openEnded: true });
    kit.cylinder(group, { radius: 0.66, height: 0.32, y: 2.15, material: kit.fabric(seat, 0.9) });
    kit.box(group, { width: 1.1, height: 0.75, depth: 0.22, y: 2.4, z: -0.55, rotationX: -0.15, material: kit.fabric(seat, 0.9) });
    return { group, width: 1.3, depth: 1.3, collide: false };
  },

  bed(kit, { size = 'queen', frame = '#c9c4bb', bedding = '#f7f6f2', throwColor = '#a7a9a8', pillowColors = ['#f4f3ef', '#f4f3ef', '#d9c9a3'] }) {
    const group = new THREE.Group();
    const mattressWidth = size === 'king' ? 6.33 : size === 'full' ? 4.5 : 5;
    const mattressLength = 6.67;
    const width = mattressWidth + 0.35;
    const depth = mattressLength + 0.6;
    const frameMaterial = kit.fabric(frame, 0.9);
    const beddingMaterial = kit.fabric(bedding, 0.95);
    const bodyZ = 0.3;
    legsAtCorners(kit, group, { width, depth: mattressLength, height: 0.3, inset: 0.2, radius: 0.07, material: '#6b5440' });
    kit.box(group, { width, height: 0.8, depth: mattressLength + 0.05, y: 0.3, z: bodyZ, material: frameMaterial });
    kit.box(group, { width: mattressWidth, height: 0.85, depth: mattressLength - 0.1, y: 1.05, z: bodyZ, material: beddingMaterial });
    kit.box(group, { width: mattressWidth + 0.2, height: 0.9, depth: mattressLength - 1.4, y: 1.08, z: bodyZ + 0.7, material: beddingMaterial });
    kit.box(group, { width: mattressWidth + 0.26, height: 0.92, depth: 1.7, y: 1.1, z: bodyZ + mattressLength / 2 - 0.9, material: kit.fabric(throwColor, 0.95) });
    const pillowCount = size === 'king' ? 3 : 2;
    for (let index = 0; index < pillowCount; index++) {
      const offset = (index - (pillowCount - 1) / 2) * (mattressWidth / pillowCount);
      kit.box(group, { width: mattressWidth / pillowCount - 0.15, height: 0.5, depth: 1.25, x: offset, y: 1.85, z: -depth / 2 + 1.25, rotationX: -0.75, material: beddingMaterial });
    }
    kit.box(group, { width: 1.5, height: 1.1, depth: 0.35, y: 1.95, z: -depth / 2 + 1.85, rotationX: -0.35, material: kit.fabric(pillowColors[2], 0.9) });
    kit.box(group, { width: width + 0.3, height: 4.4, depth: 0.4, y: 0.25, z: -depth / 2 + 0.2, material: frameMaterial });
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 6; column++) {
        kit.sphere(group, { radius: 0.045, x: -width / 2 + 0.45 + column * ((width - 0.6) / 5), y: 2.6 + row * 0.6, z: -depth / 2 + 0.41, material: kit.solid(frame, { roughness: 0.6 }), detail: 0, castShadow: false });
      }
    }
    return { group, width, depth };
  },

  nightstand(kit, { color = '#6f5340', lamp = true, width = 1.7, depth = 1.4 }) {
    const group = new THREE.Group();
    const woodMaterial = kit.solid(color, { roughness: 0.5 });
    legsAtCorners(kit, group, { width, depth, height: 0.5, inset: 0.12, radius: 0.04, material: woodMaterial });
    kit.box(group, { width, height: 1.5, depth, y: 0.5, material: woodMaterial });
    kit.box(group, { width: width - 0.12, height: 0.6, depth: 0.04, y: 1.3, z: depth / 2, material: kit.solid(color, { roughness: 0.4 }) });
    kit.box(group, { width: 0.35, height: 0.04, depth: 0.05, y: 1.6, z: depth / 2 + 0.03, material: '#c9a45c' });
    if (lamp) {
      FURNITURE.tableLamp(kit, { parent: group, y: 2.0, z: -0.1 });
    }
    return { group, width, depth };
  },

  dresser(kit, { length = 5, depth = 1.6, height = 2.8, color = '#262c38', pulls = '#c9a45c', columns = 2, rows = 3 }) {
    const group = new THREE.Group();
    const bodyMaterial = kit.solid(color, { roughness: 0.45 });
    const pullMaterial = kit.solid(pulls, { roughness: 0.3, metalness: 0.85 });
    legsAtCorners(kit, group, { width: length, depth, height: 0.35, inset: 0.15, radius: 0.05, material: pullMaterial });
    kit.box(group, { width: length, height: height - 0.35, depth, y: 0.35, material: bodyMaterial });
    const drawerWidth = (length - 0.2) / columns;
    const drawerHeight = (height - 0.55) / rows;
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const centerX = -length / 2 + 0.1 + drawerWidth * (column + 0.5);
        const bottom = 0.45 + row * drawerHeight;
        kit.box(group, { width: drawerWidth - 0.05, height: drawerHeight - 0.05, depth: 0.05, x: centerX, y: bottom, z: depth / 2, material: kit.solid(color, { roughness: 0.35 }) });
        kit.box(group, { width: 0.5, height: 0.05, depth: 0.06, x: centerX, y: bottom + drawerHeight / 2, z: depth / 2 + 0.05, material: pullMaterial });
      }
    }
    return { group, width: length, depth };
  },

  consoleTable(kit, { length = 4, depth = 1.2, height = 2.6, top = '#cdbfa8', frame = '#2b2b2b' }) {
    const group = new THREE.Group();
    kit.box(group, { width: length, height: 0.1, depth, y: height - 0.1, material: kit.solid(top, { roughness: 0.4 }) });
    legsAtCorners(kit, group, { width: length, depth, height: height - 0.1, inset: 0.08, radius: 0.03, material: kit.solid(frame, { roughness: 0.4, metalness: 0.7 }) });
    kit.box(group, { width: length - 0.2, height: 0.06, depth: depth - 0.1, y: 0.5, material: kit.solid(top, { roughness: 0.4 }) });
    return { group, width: length, depth };
  },

  desk(kit, { length = 4, depth = 2, wood = '#f1ede6', frame = '#c9a45c' }) {
    const group = new THREE.Group();
    kit.box(group, { width: length, height: 0.12, depth, y: 2.38, material: kit.solid(wood, { roughness: 0.45 }) });
    kit.box(group, { width: length - 0.2, height: 0.4, depth: depth - 0.2, y: 2.0, material: kit.solid(wood, { roughness: 0.45 }) });
    legsAtCorners(kit, group, { width: length, depth, height: 2.38, inset: 0.1, radius: 0.04, material: kit.solid(frame, { roughness: 0.3, metalness: 0.8 }) });
    return { group, width: length, depth };
  },

  art(kit, { width = 2, height = 2, palette = ['#e9dfcc', '#c8a65f', '#d9c7a1', '#ffffff'], frame = '#c8a65f', seed = 1, mat = true }) {
    const group = new THREE.Group();
    kit.box(group, { width, height, depth: 0.1, material: kit.solid(frame, { roughness: 0.35, metalness: 0.6 }), castShadow: false });
    if (mat) {
      kit.box(group, { width: width - 0.16, height: height - 0.16, depth: 0.02, y: 0.08, z: 0.05, material: '#f7f5f0', castShadow: false });
    }
    const canvasMaterial = new THREE.MeshStandardMaterial({ map: artTexture(palette, seed), roughness: 0.85 });
    const inset = mat ? 0.45 : 0.16;
    kit.box(group, { width: width - inset, height: height - inset, depth: 0.02, y: inset / 2, z: 0.07, material: canvasMaterial, castShadow: false });
    return { group, collide: false };
  },

  mirror(kit, { width = 3, height = 3.5, frame = '#a8a8a8', round = false }) {
    const group = new THREE.Group();
    const frameMaterial = kit.solid(frame, { roughness: 0.35, metalness: 0.8 });
    // Each mirror gets its own material so the engine can bake a reflection from its position.
    const glass = new THREE.MeshStandardMaterial({ color: '#d8dcdc', roughness: 0.02, metalness: 1 });
    const probe = new THREE.Object3D();
    probe.position.set(0, height / 2, 0.8);
    group.add(probe);
    kit.world.mirrors.push({ material: glass, get position() { return probe.getWorldPosition(new THREE.Vector3()); } });
    if (round) {
      kit.cylinder(group, { radius: width / 2, height: 0.08, y: height / 2, z: 0, rotationX: Math.PI / 2, material: frameMaterial, segments: 40, castShadow: false }).position.y = height / 2;
      kit.cylinder(group, { radius: width / 2 - 0.12, height: 0.02, z: 0.05, rotationX: Math.PI / 2, material: glass, segments: 40, castShadow: false }).position.y = height / 2;
    } else {
      kit.box(group, { width, height, depth: 0.08, material: frameMaterial, castShadow: false });
      kit.box(group, { width: width - 0.2, height: height - 0.2, depth: 0.02, y: 0.1, z: 0.05, material: glass, castShadow: false });
    }
    return { group, collide: false };
  },

  curtains(kit, { width = 10, height = 8.3, color = '#f3f0ea', panelWidth = 1.6, rod = '#2b2b2b' }) {
    const group = new THREE.Group();
    kit.cylinder(group, { radius: 0.035, height: width + 0.6, y: 0, x: 0, z: 0.35, rotationZ: Math.PI / 2, material: kit.solid(rod, { roughness: 0.4, metalness: 0.7 }), castShadow: false }).position.set(0, height + 0.1, 0.35);
    const sheer = kit.solid(color, { roughness: 1, opacity: 0.82, doubleSided: true });
    for (const side of [-1, 1]) {
      const panel = sheerPanel(kit, { width: panelWidth, height, folds: 5, depth: 0.12, material: sheer });
      panel.position.set(side * (width / 2 - panelWidth / 2 + 0.2), height / 2 + 0.1, 0.35);
      group.add(panel);
    }
    return { group, collide: false };
  },

  ceilingFan(kit, { ceiling = 9, blades = '#c9ab84', housing = '#a9a9a9' }) {
    const group = new THREE.Group();
    const metal = kit.solid(housing, { roughness: 0.3, metalness: 0.8 });
    kit.cylinder(group, { radius: 0.3, height: 0.12, y: ceiling - 0.12, material: metal, castShadow: false });
    kit.cylinder(group, { radius: 0.04, height: 0.75, y: ceiling - 0.85, material: metal, castShadow: false });
    kit.cylinder(group, { radiusTop: 0.3, radiusBottom: 0.26, height: 0.3, y: ceiling - 1.1, material: metal, castShadow: false });
    kit.sphere(group, { radius: 0.26, y: ceiling - 1.25, scaleY: 0.6, detail: 2, material: kit.solid('#fbf6ea', { roughness: 0.4, emissive: '#fff1d6', emissiveIntensity: 0.9 }), castShadow: false });
    const rotor = new THREE.Group();
    rotor.position.y = ceiling - 1.05;
    for (let index = 0; index < 5; index++) {
      const arm = new THREE.Group();
      arm.rotation.y = (index / 5) * Math.PI * 2;
      kit.box(arm, { width: 0.6, height: 0.05, depth: 0.12, x: 0.55, material: metal, castShadow: false });
      kit.box(arm, { width: 1.9, height: 0.03, depth: 0.42, x: 1.65, rotationX: 0.1, material: kit.solid(blades, { roughness: 0.6 }), castShadow: false });
      rotor.add(arm);
    }
    group.add(rotor);
    kit.world.spinners.push(rotor);
    return { group, collide: false };
  },

  flushLight(kit, { ceiling = 9, length = 2.2, width = 1.0 }) {
    const group = new THREE.Group();
    kit.cylinder(group, { radius: 0.5, height: 0.2, y: ceiling - 0.2, scaleX: length, scaleZ: width, material: kit.solid('#fbf8f0', { roughness: 0.5, emissive: '#fff4de', emissiveIntensity: 1.2 }), segments: 36, castShadow: false });
    kit.cylinder(group, { radius: 0.52, height: 0.04, y: ceiling - 0.22, scaleX: length, scaleZ: width, material: 'stainless', segments: 36, castShadow: false, openEnded: true });
    return { group, collide: false };
  },

  trackLight(kit, { ceiling = 9, length = 3, heads = 3 }) {
    const group = new THREE.Group();
    const metal = kit.solid('#c3c5c6', { roughness: 0.3, metalness: 0.85 });
    kit.box(group, { width: length, height: 0.08, depth: 0.12, y: ceiling - 0.1, material: metal, castShadow: false });
    for (let index = 0; index < heads; index++) {
      const headX = -length / 2 + 0.3 + (index * (length - 0.6)) / Math.max(1, heads - 1);
      kit.cylinder(group, { radius: 0.02, height: 0.3, x: headX, y: ceiling - 0.4, material: metal, castShadow: false });
      const head = kit.cylinder(group, { radius: 0.13, height: 0.4, x: headX, y: ceiling - 0.6, material: metal, castShadow: false });
      head.rotation.z = (index - 1) * 0.5;
    }
    return { group, collide: false };
  },

  pendant(kit, { ceiling = 9, drop = 3, globe = 0.6 }) {
    const group = new THREE.Group();
    kit.cylinder(group, { radius: 0.2, height: 0.06, y: ceiling - 0.06, material: '#2b2b2b', castShadow: false });
    kit.cylinder(group, { radius: 0.012, height: drop, y: ceiling - drop, material: '#2b2b2b', castShadow: false });
    kit.sphere(group, { radius: globe, y: ceiling - drop - globe * 0.8, detail: 3, material: kit.solid('#fffaf0', { roughness: 0.2, emissive: '#ffefd2', emissiveIntensity: 1.1 }), castShadow: false });
    return { group, collide: false };
  },

  // A straight run of base cabinets with countertop. gaps: [{ at, width, kind: 'range' | 'dishwasher' | 'open' }].
  baseRun(kit, { length, depth = 2, gaps = [], sinkAt = null, splash = true, backsplash = 0, counterHeight = 3.0 }) {
    const group = new THREE.Group();
    const toeKick = 0.33;
    const counterThickness = 0.1;
    const carcassTop = counterHeight - counterThickness;
    const sortedGaps = [...gaps].sort((first, second) => first.at - second.at);
    const segments = [];
    let cursor = -length / 2;
    for (const gap of sortedGaps) {
      const gapStart = gap.at - gap.width / 2;
      if (gapStart > cursor + 0.05) {
        segments.push([cursor, gapStart]);
      }
      cursor = gap.at + gap.width / 2;
    }
    if (length / 2 > cursor + 0.05) {
      segments.push([cursor, length / 2]);
    }

    for (const [from, to] of segments) {
      const segmentLength = to - from;
      const centerX = (from + to) / 2;
      kit.box(group, { width: segmentLength, height: toeKick, depth: depth - 0.3, x: centerX, z: -0.15, material: '#2c2a28', castShadow: false });
      kit.box(group, { width: segmentLength, height: carcassTop - toeKick, depth: depth - 0.1, x: centerX, y: toeKick, z: -0.05, material: 'cabinet' });
      doorFronts(kit, group, { from: from + 0.01, to: to - 0.01, frontZ: depth / 2 - 0.07, bottom: toeKick, top: carcassTop, drawerHeight: 0.55 });
      kit.box(group, { width: segmentLength + 0.02, height: counterThickness, depth: depth + 0.08, x: centerX, y: carcassTop, z: 0.04, material: 'counter' });
      if (backsplash > 0) {
        kit.box(group, { width: segmentLength, height: backsplash, depth: 0.04, x: centerX, y: counterHeight, z: -depth / 2 + 0.02, material: 'subway', castShadow: false });
      } else if (splash) {
        kit.box(group, { width: segmentLength, height: 0.33, depth: 0.06, x: centerX, y: counterHeight, z: -depth / 2 + 0.03, material: 'counter' });
      }
    }

    for (const gap of sortedGaps) {
      if (gap.kind === 'dishwasher') {
        kit.box(group, { width: gap.width, height: carcassTop - toeKick, depth: depth - 0.1, x: gap.at, y: toeKick, z: -0.05, material: 'cabinet' });
        kit.box(group, { width: gap.width - 0.04, height: carcassTop - toeKick - 0.04, depth: 0.08, x: gap.at, y: toeKick + 0.02, z: depth / 2 - 0.05, material: 'stainless' });
        kit.box(group, { width: gap.width - 0.4, height: 0.05, depth: 0.08, x: gap.at, y: carcassTop - 0.35, z: depth / 2 + 0.05, material: 'stainless' });
        kit.box(group, { width: gap.width, height: 0.33, depth: depth - 0.3, x: gap.at, z: -0.15, material: '#2c2a28', castShadow: false });
        kit.box(group, { width: gap.width + 0.02, height: counterThickness, depth: depth + 0.08, x: gap.at, y: carcassTop, z: 0.04, material: 'counter' });
        if (splash) {
          kit.box(group, { width: gap.width, height: 0.33, depth: 0.06, x: gap.at, y: counterHeight, z: -depth / 2 + 0.03, material: 'counter' });
        }
      }
    }

    if (sinkAt !== null) {
      FURNITURE.kitchenSink(kit, { parent: group, x: sinkAt, y: counterHeight, z: 0 });
    }

    return { group, width: length, depth };
  },

  counterSlab(kit, { length, depth, thickness = 0.1, counterHeight = 3.0 }) {
    const group = new THREE.Group();
    kit.box(group, { width: length, height: thickness, depth, y: counterHeight - thickness, material: 'counter' });
    return { group, width: length, depth };
  },

  kitchenSink(kit, { parent, x = 0, y = 3.0, z = 0 }) {
    const group = parent ?? new THREE.Group();
    const basin = kit.solid('#8d9194', { roughness: 0.35, metalness: 0.85 });
    const deep = kit.solid('#4a4e51', { roughness: 0.4, metalness: 0.8 });
    kit.box(group, { width: 2.7, height: 0.01, depth: 1.45, x, y: y + 0.001, z, material: basin, castShadow: false });
    for (const side of [-1, 1]) {
      kit.box(group, { width: 1.2, height: 0.012, depth: 1.25, x: x + side * 0.65, y: y + 0.002, z, material: deep, castShadow: false });
    }
    const chrome = 'stainless';
    kit.cylinder(group, { radius: 0.07, height: 1.2, x, y, z: z - 0.62, material: chrome, segments: 12 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 24, Math.PI), kit.resolveMaterial(chrome));
    arc.position.set(x, y + 1.2, z - 0.3);
    arc.rotation.y = Math.PI / 2;
    group.add(arc);
    kit.cylinder(group, { radius: 0.05, height: 0.25, x, y: y + 0.95, z: z + 0.02, material: chrome, segments: 12 });
    return { group, collide: false };
  },

  fridge(kit, { width = 3, depth = 2.6, height = 5.8 }) {
    const group = new THREE.Group();
    kit.box(group, { width, height: height - 0.05, depth: depth - 0.15, y: 0.05, z: -0.075, material: 'stainless' });
    kit.box(group, { width: width - 0.04, height: 1.75, depth: 0.12, y: height - 1.8, z: depth / 2 - 0.12, material: 'stainless' });
    kit.box(group, { width: width - 0.04, height: height - 2.0, depth: 0.12, y: 0.12, z: depth / 2 - 0.12, material: 'stainless' });
    const handle = kit.solid('#d5d8da', { roughness: 0.2, metalness: 0.9 });
    kit.box(group, { width: 0.06, height: 1.1, depth: 0.12, x: -width / 2 + 0.25, y: height - 1.55, z: depth / 2 + 0.03, material: handle });
    kit.box(group, { width: 0.06, height: 1.6, depth: 0.12, x: -width / 2 + 0.25, y: height - 3.8, z: depth / 2 + 0.03, material: handle });
    return { group, width, depth };
  },

  range(kit, { width = 2.5, depth = 2.15 }) {
    const group = new THREE.Group();
    kit.box(group, { width, height: 2.9, depth: depth - 0.1, z: -0.05, material: 'stainless' });
    kit.box(group, { width: width - 0.04, height: 0.06, depth: depth - 0.25, y: 2.9, z: 0.02, material: kit.solid('#121314', { roughness: 0.08, metalness: 0.2 }) });
    const ring = kit.solid('#3a3b3d', { roughness: 0.3 });
    for (const [offsetX, offsetZ, radius] of [[-0.55, -0.35, 0.36], [0.55, -0.35, 0.3], [-0.55, 0.42, 0.3], [0.55, 0.42, 0.36]]) {
      const burner = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 6, 32), ring);
      burner.rotation.x = Math.PI / 2;
      burner.position.set(offsetX, 2.965, offsetZ);
      group.add(burner);
    }
    kit.box(group, { width, height: 0.55, depth: 0.25, y: 2.95, z: -depth / 2 + 0.12, material: 'stainless' });
    for (let index = 0; index < 5; index++) {
      kit.cylinder(group, { radius: 0.07, height: 0.06, x: -0.8 + index * 0.4, y: 3.2, z: -depth / 2 + 0.25, rotationX: Math.PI / 2, material: '#2a2a2a', segments: 12 });
    }
    kit.box(group, { width: width - 0.4, height: 1.1, depth: 0.04, y: 0.9, z: depth / 2 - 0.08, material: kit.solid('#0d0e10', { roughness: 0.05, metalness: 0.3 }) });
    kit.box(group, { width: width - 0.3, height: 0.06, depth: 0.12, y: 2.25, z: depth / 2, material: '#d5d8da' });
    kit.box(group, { width: width - 0.1, height: 0.35, depth: 0.04, y: 0.15, z: depth / 2 - 0.06, material: 'stainless' });
    return { group, width, depth };
  },

  microwave(kit, { width = 2.5, depth = 1.3, height = 1.4 }) {
    const group = new THREE.Group();
    kit.box(group, { width, height, depth, material: 'stainless' });
    kit.box(group, { width: width * 0.68, height: height - 0.3, depth: 0.03, x: -width * 0.12, y: 0.15, z: depth / 2, material: kit.solid('#0d0e10', { roughness: 0.05, metalness: 0.3 }) });
    kit.box(group, { width: width * 0.2, height: height - 0.3, depth: 0.03, x: width * 0.36, y: 0.15, z: depth / 2, material: '#1b1c1e' });
    return { group, collide: false };
  },

  upperRun(kit, { length, depth = 1.0, height = 3.0 }) {
    const group = new THREE.Group();
    kit.box(group, { width: length, height, depth: depth - 0.07, z: -0.035, material: 'cabinet' });
    const count = Math.max(1, Math.round(length / 1.5));
    const unit = length / count;
    for (let index = 0; index < count; index++) {
      const centerX = -length / 2 + unit * (index + 0.5);
      kit.box(group, { width: unit - 0.03, height: height - 0.03, depth: 0.06, x: centerX, y: 0.015, z: depth / 2 - 0.03, material: 'cabinetDoor' });
      const pullX = centerX + (index % 2 === 0 ? 1 : -1) * (unit / 2 - 0.16);
      kit.box(group, { width: 0.035, height: 0.42, depth: 0.05, x: pullX, y: 0.25, z: depth / 2 + 0.03, material: 'stainless' });
    }
    return { group, collide: false };
  },

  vanity(kit, { length = 3, depth = 1.8, height = 2.8, sinks = 1, top = '#f3f2ee' }) {
    const group = new THREE.Group();
    kit.box(group, { width: length, height: 0.3, depth: depth - 0.25, z: -0.12, material: '#2c2a28', castShadow: false });
    kit.box(group, { width: length, height: height - 0.4, depth: depth - 0.1, y: 0.3, z: -0.05, material: 'cabinet' });
    doorFronts(kit, group, { from: -length / 2 + 0.01, to: length / 2 - 0.01, frontZ: depth / 2 - 0.07, bottom: 0.3, top: height - 0.1, drawerHeight: 0 });
    kit.box(group, { width: length + 0.06, height: 0.1, depth: depth + 0.06, y: height - 0.1, z: 0.03, material: kit.solid(top, { roughness: 0.18 }) });
    kit.box(group, { width: length, height: 0.33, depth: 0.06, y: height, z: -depth / 2 + 0.03, material: kit.solid(top, { roughness: 0.18 }) });
    for (let index = 0; index < sinks; index++) {
      const centerX = sinks === 1 ? 0 : (index - 0.5) * (length / 2);
      kit.cylinder(group, { radius: 0.6, height: 0.012, x: centerX, y: height + 0.001, z: 0.05, scaleZ: 0.72, material: kit.solid('#e2e2df', { roughness: 0.15 }), castShadow: false });
      kit.cylinder(group, { radius: 0.04, height: 0.55, x: centerX, y: height, z: -depth / 2 + 0.3, material: 'stainless', segments: 10 });
      kit.box(group, { width: 0.06, height: 0.05, depth: 0.42, x: centerX, y: height + 0.5, z: -depth / 2 + 0.48, material: 'stainless' });
    }
    return { group, width: length, depth };
  },

  vanityLight(kit, { length = 2.6, bulbs = 3 }) {
    const group = new THREE.Group();
    kit.box(group, { width: length, height: 0.12, depth: 0.12, material: 'stainless', castShadow: false });
    for (let index = 0; index < bulbs; index++) {
      const bulbX = -length / 2 + 0.3 + (index * (length - 0.6)) / Math.max(1, bulbs - 1);
      kit.cylinder(group, { radiusTop: 0.12, radiusBottom: 0.25, height: 0.4, x: bulbX, y: -0.3, z: 0.25, material: kit.solid('#fbf6ea', { roughness: 0.3, emissive: '#fff0d6', emissiveIntensity: 1.1 }), castShadow: false });
    }
    return { group, collide: false };
  },

  toilet(kit, {}) {
    const group = new THREE.Group();
    const porcelain = 'porcelain';
    kit.box(group, { width: 1.65, height: 1.25, depth: 0.62, y: 1.35, z: -0.9, material: porcelain });
    kit.box(group, { width: 1.72, height: 0.08, depth: 0.7, y: 2.6, z: -0.9, material: porcelain });
    kit.cylinder(group, { radiusTop: 0.62, radiusBottom: 0.4, height: 1.25, z: 0.05, scaleZ: 1.35, material: porcelain, segments: 28 });
    kit.cylinder(group, { radius: 0.66, height: 0.08, y: 1.25, z: 0.08, scaleZ: 1.32, material: porcelain, segments: 28 });
    kit.box(group, { width: 0.7, height: 0.6, depth: 0.5, y: 0.1, z: -0.55, material: porcelain });
    return { group, width: 1.75, depth: 2.5 };
  },

  tub(kit, { length = 5, width = 2.5, surround = true, surroundHeight = 6.1, curtain = '#eef0ef' }) {
    const group = new THREE.Group();
    const porcelain = 'porcelain';
    const rim = 1.45;
    const wall = 0.25;
    kit.box(group, { width: length, height: rim, depth: wall, z: width / 2 - wall / 2, material: porcelain });
    kit.box(group, { width: length, height: rim, depth: wall, z: -width / 2 + wall / 2, material: porcelain });
    kit.box(group, { width: wall, height: rim, depth: width, x: -length / 2 + wall / 2, material: porcelain });
    kit.box(group, { width: wall, height: rim, depth: width, x: length / 2 - wall / 2, material: porcelain });
    kit.box(group, { width: length - wall * 2, height: 0.3, depth: width - wall * 2, material: kit.solid('#f4f4f2', { roughness: 0.12 }) });
    kit.cylinder(group, { radius: 0.06, height: 0.4, x: -length / 2 + 0.05, y: 2.2, z: 0, rotationZ: Math.PI / 2, material: 'stainless', segments: 10 }).position.set(-length / 2 + 0.2, 2.2, 0);
    kit.cylinder(group, { radius: 0.05, height: 0.6, x: -length / 2 + 0.05, y: 5.6, z: 0, rotationZ: Math.PI / 2.6, material: 'stainless', segments: 10 }).position.set(-length / 2 + 0.25, 5.8, 0);

    if (surround) {
      kit.box(group, { width: length, height: surroundHeight - rim, depth: 0.03, y: rim, z: -width / 2 - 0.0, material: 'subway', castShadow: false });
      for (const side of [-1, 1]) {
        kit.box(group, { width: 0.03, height: surroundHeight - rim, depth: width, x: side * (length / 2), y: rim, material: 'subway', castShadow: false });
      }
    }

    kit.cylinder(group, { radius: 0.03, height: length, y: 0, rotationZ: Math.PI / 2, material: 'stainless', segments: 8, castShadow: false }).position.set(0, 6.6, width / 2 - 0.05);
    const drape = kit.solid(curtain, { roughness: 1, opacity: 0.94, doubleSided: true });
    const panel = sheerPanel(kit, { width: length * 0.42, height: 5.4, folds: 6, depth: 0.1, material: drape });
    panel.position.set(length / 2 - length * 0.21 - 0.05, 3.9, width / 2 - 0.05);
    group.add(panel);
    return { group, width: length, depth: width };
  },

  towelBar(kit, { length = 2, towel = '#e9e4da' }) {
    const group = new THREE.Group();
    kit.cylinder(group, { radius: 0.03, height: length, rotationZ: Math.PI / 2, material: 'stainless', segments: 8, castShadow: false }).position.set(0, 4.0, 0.15);
    kit.box(group, { width: length * 0.7, height: 1.6, depth: 0.12, y: 2.45, z: 0.15, material: kit.fabric(towel, 1) });
    return { group, collide: false };
  },

  washerDryer(kit, { width = 2.25, depth = 2.1 }) {
    const group = new THREE.Group();
    const white = kit.solid('#f2f2f0', { roughness: 0.35 });
    const glass = kit.solid('#202529', { roughness: 0.1, metalness: 0.4 });
    for (const bottom of [0, 2.85]) {
      kit.box(group, { width, height: 2.8, depth, y: bottom, material: white });
      kit.cylinder(group, { radius: 0.62, height: 0.06, y: bottom + 1.25, z: 0, rotationX: Math.PI / 2, material: 'stainless', segments: 32 }).position.set(0, bottom + 1.25, depth / 2 + 0.02);
      kit.cylinder(group, { radius: 0.48, height: 0.06, rotationX: Math.PI / 2, material: glass, segments: 32 }).position.set(0, bottom + 1.25, depth / 2 + 0.05);
      kit.box(group, { width: width - 0.2, height: 0.3, depth: 0.04, y: bottom + 2.35, z: depth / 2, material: '#d9dadb' });
    }
    return { group, width, depth };
  },

  waterHeater(kit, { radius = 0.8, height = 5 }) {
    const group = new THREE.Group();
    kit.cylinder(group, { radius, height, material: kit.solid('#ecebe8', { roughness: 0.4 }) });
    kit.cylinder(group, { radius: 0.06, height: 2.5, x: -0.25, y: height, material: '#b07a4a', segments: 8 });
    kit.cylinder(group, { radius: 0.06, height: 2.5, x: 0.25, y: height, material: '#b07a4a', segments: 8 });
    return { group, width: radius * 2, depth: radius * 2 };
  },

  airHandler(kit, { width = 2.2, depth = 2.0, height = 5 }) {
    const group = new THREE.Group();
    kit.box(group, { width, height, depth, material: kit.solid('#c8cacb', { roughness: 0.45, metalness: 0.4 }) });
    kit.box(group, { width: width - 0.3, height: 1.6, depth: 0.03, y: 0.4, z: depth / 2, material: '#9a9c9e' });
    return { group, width, depth };
  },

  closetSystem(kit, { length = 6, depth = 2, shelvesOnly = false, seed = 9 }) {
    const group = new THREE.Group();
    const shelfMaterial = kit.solid('#f2efe9', { roughness: 0.7 });
    const random = seededRandom(seed);
    const CLOTHES = ['#2f3b4c', '#c9c2b4', '#7a2f2f', '#e9e6df', '#3f5a48', '#16181b', '#b6a07c', '#5f6f86', '#d8cdbd'];

    if (shelvesOnly) {
      for (let level = 0; level < 5; level++) {
        kit.box(group, { width: length, height: 0.06, depth: depth - 0.2, y: 1.0 + level * 1.25, material: shelfMaterial });
        let cursor = -length / 2 + 0.15;
        while (cursor < length / 2 - 0.6) {
          const stackWidth = 0.6 + random() * 0.5;
          kit.box(group, { width: stackWidth - 0.08, height: 0.25 + random() * 0.45, depth: depth - 0.6, x: cursor + stackWidth / 2, y: 1.06 + level * 1.25, material: kit.fabric(CLOTHES[Math.floor(random() * CLOTHES.length)], 1) });
          cursor += stackWidth + random() * 0.4;
        }
      }
      return { group, width: length, depth };
    }

    kit.box(group, { width: length, height: 0.06, depth, y: 5.65, material: shelfMaterial });
    kit.cylinder(group, { radius: 0.04, height: length, rotationZ: Math.PI / 2, material: 'stainless', segments: 8, castShadow: false }).position.set(0, 5.4, 0);
    let cursor = -length / 2 + 0.2;
    while (cursor < length / 2 - 0.3) {
      const garmentWidth = 0.12 + random() * 0.14;
      const garmentHeight = 2.2 + random() * 1.7;
      kit.box(group, { width: garmentWidth, height: garmentHeight, depth: 1.55 + random() * 0.2, x: cursor, y: 5.3 - garmentHeight, rotationY: (random() - 0.5) * 0.25, material: kit.fabric(CLOTHES[Math.floor(random() * CLOTHES.length)], 1) });
      cursor += garmentWidth + 0.04 + random() * 0.08;
    }
    for (let index = 0; index < 3; index++) {
      kit.box(group, { width: 1.1, height: 0.7, depth: 1.2, x: -length / 2 + 0.8 + index * (length / 3), y: 5.71, material: kit.solid(['#d8c9ad', '#a4b0b5', '#efece6'][index], { roughness: 0.8 }) });
    }
    return { group, width: length, depth };
  },

  railing(kit, { length, height = 3.5, color = '#2d2a27' }) {
    const group = new THREE.Group();
    const metal = kit.solid(color, { roughness: 0.5, metalness: 0.6 });
    kit.box(group, { width: length, height: 0.12, depth: 0.2, y: height - 0.12, material: metal });
    kit.box(group, { width: length, height: 0.08, depth: 0.12, y: 0.3, material: metal });
    const count = Math.floor(length / 0.36);
    for (let index = 0; index <= count; index++) {
      kit.box(group, { width: 0.05, height: height - 0.4, depth: 0.05, x: -length / 2 + (index * length) / count, y: 0.3, material: metal, castShadow: true });
    }
    return { group, width: length, depth: 0.3 };
  },

  bistroSet(kit, { metal = '#2f3437' }) {
    const group = new THREE.Group();
    const metalMaterial = kit.solid(metal, { roughness: 0.5, metalness: 0.6 });
    kit.cylinder(group, { radius: 1.0, height: 0.06, y: 2.3, material: metalMaterial, segments: 28 });
    kit.cylinder(group, { radius: 0.05, height: 2.3, material: metalMaterial, segments: 8 });
    kit.cylinder(group, { radius: 0.5, height: 0.05, material: metalMaterial, segments: 20 });
    for (const side of [-1, 1]) {
      const chair = new THREE.Group();
      chair.position.set(side * 1.65, 0, 0);
      chair.rotation.y = side * -Math.PI / 2;
      legsAtCorners(kit, chair, { width: 1.3, depth: 1.3, height: 1.5, inset: 0.08, radius: 0.03, material: metalMaterial });
      kit.box(chair, { width: 1.35, height: 0.08, depth: 1.35, y: 1.5, material: metalMaterial });
      kit.box(chair, { width: 1.3, height: 1.2, depth: 0.06, y: 1.6, z: -0.65, rotationX: -0.1, material: metalMaterial });
      group.add(chair);
    }
    return { group, width: 4.6, depth: 2.2 };
  },

  rangeHood(kit, { width = 3, ceiling = 9, bottom = 5.6 }) {
    const group = new THREE.Group();
    const canopyHeight = 0.9;
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 1, canopyHeight, 4, 1), kit.resolveMaterial('stainless'));
    canopy.rotation.y = Math.PI / 4;
    canopy.scale.set(width / 1.42, 1, 1.6 / 1.42);
    canopy.position.set(0, bottom + canopyHeight / 2, 0);
    canopy.castShadow = true;
    group.add(canopy);
    kit.box(group, { width: width, height: 0.12, depth: 1.62, y: bottom, material: 'stainless' });
    kit.box(group, { width: 0.95, height: ceiling - bottom - canopyHeight, depth: 0.8, y: bottom + canopyHeight, z: -0.4, material: 'stainless' });
    return { group, collide: false };
  },

  cooktop(kit, { width = 2.5, counterHeight = 3.0 }) {
    const group = new THREE.Group();
    kit.box(group, { width, height: 0.04, depth: 1.75, y: counterHeight, material: kit.solid('#1b1c1e', { roughness: 0.25, metalness: 0.4 }) });
    const grate = kit.solid('#2a2a2a', { roughness: 0.6, metalness: 0.3 });
    for (const offsetX of [-width / 4, width / 4]) {
      kit.box(group, { width: width / 2 - 0.1, height: 0.06, depth: 1.6, x: offsetX, y: counterHeight + 0.04, material: grate });
      for (const offsetZ of [-0.4, 0.4]) {
        kit.cylinder(group, { radius: 0.18, height: 0.08, x: offsetX, y: counterHeight + 0.05, z: offsetZ, material: '#3b3b3b', segments: 16 });
      }
    }
    return { group, collide: false };
  },

  wallOvens(kit, { width = 2.6, depth = 2.1, height = 8.0 }) {
    const group = new THREE.Group();
    kit.box(group, { width, height, depth, material: 'cabinet' });
    kit.box(group, { width: width - 0.04, height: 1.25, depth: 0.06, y: 0.35, z: depth / 2, material: 'cabinetDoor' });
    kit.box(group, { width: width - 0.04, height: height - 6.1, depth: 0.06, y: 6.05, z: depth / 2, material: 'cabinetDoor' });
    for (const bottom of [1.7, 3.85]) {
      kit.box(group, { width: width - 0.15, height: 2.1, depth: 0.08, y: bottom, z: depth / 2, material: 'stainless' });
      kit.box(group, { width: width - 0.6, height: 1.2, depth: 0.03, y: bottom + 0.45, z: depth / 2 + 0.05, material: kit.solid('#0d0e10', { roughness: 0.05, metalness: 0.3 }) });
      kit.box(group, { width: width - 0.5, height: 0.06, depth: 0.12, y: bottom + 1.85, z: depth / 2 + 0.1, material: '#d5d8da' });
    }
    return { group, width, depth };
  },

  chandelier(kit, { ceiling = 9, drop = 2.6, arms = 6, radius = 1.1, finish = '#1e1e1e' }) {
    const group = new THREE.Group();
    const metal = kit.solid(finish, { roughness: 0.45, metalness: 0.6 });
    const bulb = kit.solid('#fff4dc', { roughness: 0.3, emissive: '#ffe9c4', emissiveIntensity: 1.6 });
    kit.cylinder(group, { radius: 0.18, height: 0.06, y: ceiling - 0.06, material: metal, castShadow: false });
    kit.cylinder(group, { radius: 0.02, height: drop, y: ceiling - drop, material: metal, castShadow: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.025, 6, 40), metal);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ceiling - drop;
    group.add(ring);
    for (let index = 0; index < arms; index++) {
      const angle = (index / arms) * Math.PI * 2;
      const armX = Math.cos(angle) * radius;
      const armZ = Math.sin(angle) * radius;
      kit.box(group, { width: radius, height: 0.03, depth: 0.03, x: armX / 2, y: ceiling - drop - 0.015, z: armZ / 2, rotationY: -angle, material: metal, castShadow: false });
      kit.cylinder(group, { radius: 0.05, height: 0.5, x: armX, y: ceiling - drop, z: armZ, material: metal, segments: 8, castShadow: false });
      kit.sphere(group, { radius: 0.08, x: armX, y: ceiling - drop + 0.58, z: armZ, material: bulb, detail: 1, castShadow: false });
    }
    return { group, collide: false };
  },

  canLight(kit, { ceiling = 9 }) {
    const group = new THREE.Group();
    kit.cylinder(group, { radius: 0.3, height: 0.02, y: ceiling - 0.021, material: 'trim', segments: 24, castShadow: false });
    kit.cylinder(group, { radius: 0.22, height: 0.02, y: ceiling - 0.03, material: kit.solid('#fffaf0', { emissive: '#fff3dc', emissiveIntensity: 1.8 }), segments: 24, castShadow: false });
    return { group, collide: false };
  },

  fireplace(kit, { width = 5.2, height = 4.6, depth = 1.2 }) {
    const group = new THREE.Group();
    kit.box(group, { width, height, depth, material: 'trim' });
    kit.box(group, { width: width + 0.6, height: 0.22, depth: depth + 0.3, y: height, z: 0.1, material: 'trim' });
    kit.box(group, { width: 3.0, height: 2.4, depth: 0.1, y: 0.55, z: depth / 2 + 0.01, material: kit.solid('#121212', { roughness: 0.6 }) });
    kit.box(group, { width: 3.4, height: 0.12, depth: 0.08, y: 2.95, z: depth / 2 + 0.03, material: kit.solid('#2a2a2a', { roughness: 0.4, metalness: 0.5 }) });
    kit.box(group, { width: width + 0.4, height: 0.12, depth: 1.6, y: 0, z: depth / 2 + 0.6, material: kit.solid('#3a3836', { roughness: 0.5 }) });
    return { group, width, depth: depth + 1.4 };
  },

  // A tiled shower that fills a wall-to-wall alcove: tile on the back and both sides, glass across the front.
  showerStall(kit, { width = 4, depth = 5.8, glassHeight = 7, tileHeight = 8, bench = true }) {
    const group = new THREE.Group();
    kit.box(group, { width, height: tileHeight, depth: 0.04, z: -depth / 2 + 0.02, material: 'showerTile', castShadow: false });
    for (const side of [-1, 1]) {
      kit.box(group, { width: 0.04, height: tileHeight, depth, x: side * (width / 2 - 0.02), material: 'showerTile', castShadow: false });
    }
    kit.box(group, { width: width - 0.1, height: 0.25, depth: depth - 0.1, material: 'showerTile', castShadow: false });
    kit.box(group, { width: width - 0.1, height: glassHeight - 0.25, depth: 0.04, y: 0.25, z: depth / 2 - 0.05, material: 'glass' });
    kit.box(group, { width: 0.05, height: glassHeight - 0.25, depth: 0.06, x: width / 2 - 0.08, y: 0.25, z: depth / 2 - 0.05, material: '#1e1e1e' });
    kit.box(group, { width: 0.05, height: glassHeight - 0.25, depth: 0.06, x: -width / 2 + 0.08, y: 0.25, z: depth / 2 - 0.05, material: '#1e1e1e' });
    kit.box(group, { width: 0.04, height: 1.2, depth: 0.1, x: 0, y: 3.4, z: depth / 2, material: '#1e1e1e' });
    if (bench) {
      kit.box(group, { width: width - 0.1, height: 1.5, depth: 1.2, z: -depth / 2 + 0.65, material: 'showerTile' });
    }
    kit.cylinder(group, { radius: 0.3, height: 0.05, y: 6.9, z: -depth / 2 + 0.9, material: '#1e1e1e', segments: 24, castShadow: false });
    kit.box(group, { width: 0.06, height: 0.06, depth: 0.8, y: 7.0, z: -depth / 2 + 0.45, material: '#1e1e1e', castShadow: false });
    return { group, width, depth: 0.2, collide: false };
  },

  column(kit, { size = 0.8, height = 9 }) {
    const group = new THREE.Group();
    kit.box(group, { width: size + 0.3, height: 0.5, depth: size + 0.3, material: 'trim' });
    kit.box(group, { width: size, height: height - 0.8, depth: size, y: 0.5, material: 'trim' });
    kit.box(group, { width: size + 0.25, height: 0.3, depth: size + 0.25, y: height - 0.3, material: 'trim' });
    return { group, width: size, depth: size };
  },

  tree(kit, { height = 22, spread = 9, seed = 5 }) {
    const group = new THREE.Group();
    const random = seededRandom(seed);
    kit.cylinder(group, { radiusTop: 0.35, radiusBottom: 0.6, height: height * 0.55, material: '#6b5644', segments: 10 });
    const canopy = kit.solid(['#4c6b3c', '#5a7944', '#456236'][Math.floor(random() * 3)], { roughness: 0.9 });
    for (let index = 0; index < 5; index++) {
      kit.sphere(group, { radius: spread * (0.45 + random() * 0.25), x: (random() - 0.5) * spread * 0.7, y: height * (0.6 + random() * 0.25), z: (random() - 0.5) * spread * 0.7, material: canopy, detail: 1 });
    }
    return { group, width: 1.2, depth: 1.2 };
  },
};
