// Niblock Homes "Waverly" (2 bed, 2 bath, 1,629 sq ft ranch, Elevation A), Cumberland, Concord NC.
// Traced from Niblock's 1920px interactive floor plan image. Scale is 17.78 px per foot, fit from the
// inner-face clear spans of the main bedroom, family room, kitchen, bedroom 2 and garage (spread
// +/-0.4%). Wall positions and every door/window gap come from scanning the drawn wall lines.
// Exterior wall centerlines sit 3" outside the drawn inner face; interior walls sit on the drawn line.
// Finishes follow Niblock's photos of the built Waverly at Cumberland lot 59.

const PLAN = {
  name: 'Waverly',
  eyebrow: 'Niblock Homes · Cumberland, Concord NC',
  specs: '2 bed · 2 bath · 1,629 sq ft · 2-car garage',
  note: "Built to scale from Niblock's published Waverly plan. Independent concept demo, not affiliated with Niblock Homes.",
  ceilingHeight: 9,
  crownMolding: true,
  exteriorColor: '#d9d7d1',
  startRoom: 'foyer',
  overview: { azimuth: -0.5, polar: 0.7 },
  sun: [-0.4, 0.75, -0.6],
  roomLightColor: '#fff0e0',

  rooms: [
    { id: 'family', name: 'Family room', dimensions: '13\'4" × 15\'0"', floor: 'wood', polygon: [[13.02, 0], [26.71, 0], [26.71, 23.8], [19.94, 23.8], [19.94, 21.31], [13.02, 21.31]], labelAt: [19.8, 7.6], view: { at: [23.0, 21.6], look: [19.0, 1] } },
    { id: 'dining', name: 'Dining', dimensions: '12\'0" × 12\'4"', floor: 'wood', polygon: [[26.71, 11.25], [38.69, 11.25], [38.69, 23.8], [26.71, 23.8]], view: { at: [24.8, 25.8], look: [33.5, 12.8] } },
    { id: 'kitchen', name: 'Kitchen', dimensions: '18\'4" × 13\'9"', floor: 'wood', polygon: [[19.94, 23.8], [38.69, 23.8], [38.69, 32.62], [33.46, 32.62], [33.46, 37.68], [19.94, 37.68]], labelAt: [24.8, 31.6], view: { at: [22.6, 32.0], look: [37.5, 27] } },
    { id: 'foyer', name: 'Foyer', floor: 'wood', polygon: [[19.94, 37.68], [26.6, 37.68], [26.6, 50.6], [19.94, 50.6]], labelAt: [23.3, 45], view: { at: [23.3, 49.0], look: [23.3, 25] } },
    { id: 'main', name: 'Main bedroom', dimensions: '12\'7" × 15\'0"', floor: 'carpet', polygon: [[0, 0], [13.02, 0], [13.02, 15.38], [0, 15.38]], view: { at: [11.1, 13.8], look: [3, 4.5] }, alsoCovers: ['vestibule', 'wic'] },
    { id: 'vestibule', name: 'Hall', floor: 'wood', polygon: [[8.88, 15.38], [13.02, 15.38], [13.02, 19.63], [8.88, 19.63]], label: false },
    { id: 'mainBath', name: 'Main bath', floor: 'stone', polygon: [[0, 15.38], [8.88, 15.38], [8.88, 19.63], [12.15, 19.63], [12.15, 29.05], [4.16, 29.05], [4.16, 28.06], [0, 28.06]], labelAt: [6.8, 23.6], view: { at: [6.7, 17.6], look: [11, 26] } },
    { id: 'wic', name: 'Walk-in closet', floor: 'carpet', polygon: [[0, 28.06], [4.16, 28.06], [4.16, 29.05], [12.15, 29.05], [12.15, 34.7], [0, 34.7]], view: { at: [8.0, 30.4], look: [2, 33.5] }, chip: false },
    { id: 'laundry', name: 'Laundry', floor: 'stone', polygon: [[12.15, 21.31], [19.94, 21.31], [19.94, 29.05], [12.15, 29.05]], view: { at: [17.6, 27.6], look: [13, 24] } },
    { id: 'mudroom', name: 'Drop zone', floor: 'wood', polygon: [[14.8, 29.05], [19.94, 29.05], [19.94, 34.7], [14.8, 34.7]], label: false },
    { id: 'coat', name: 'Closet', floor: 'wood', polygon: [[12.15, 29.05], [14.8, 29.05], [14.8, 34.7], [12.15, 34.7]], label: false },
    { id: 'pantry', name: 'Pantry', floor: 'wood', polygon: [[33.46, 32.62], [38.69, 32.62], [38.69, 37.68], [33.46, 37.68]], label: false },
    { id: 'linen', name: 'Linen', floor: 'wood', polygon: [[26.6, 37.68], [30.14, 37.68], [30.14, 38.8], [26.6, 38.8]], label: false },
    { id: 'hall2', name: 'Hall', floor: 'wood', polygon: [[26.6, 38.8], [30.14, 38.8], [30.14, 45.72], [26.6, 45.72]], label: false },
    { id: 'bath2', name: 'Bath', floor: 'tile', polygon: [[30.14, 37.68], [38.69, 37.68], [38.69, 43.22], [30.14, 43.22]], view: { at: [33.6, 42.3], look: [37.5, 38.2] } },
    { id: 'closet2', name: 'Closet', floor: 'carpet', polygon: [[30.14, 43.22], [38.69, 43.22], [38.69, 45.72], [30.14, 45.72]], label: false },
    { id: 'bedroom2', name: 'Bedroom 2', dimensions: '11\'8" × 11\'5"', floor: 'carpet', polygon: [[26.6, 45.72], [38.69, 45.72], [38.69, 57.59], [26.6, 57.59]], view: { at: [28.2, 47.2], look: [36, 54.5] } },
    { id: 'garage', name: 'Garage', dimensions: '19\'7" × 22\'6"', floor: 'concrete', lightScale: 0.35, polygon: [[0, 34.7], [19.94, 34.7], [19.94, 57.59], [0, 57.59]], view: { at: [17.8, 36.6], look: [6, 50] } },
    { id: 'coveredPorch', name: 'Covered porch', dimensions: '12\'0" × 11\'4"', floor: 'concrete', outdoor: true, covered: true, polygon: [[26.71, 0], [38.69, 0], [38.69, 11.25], [26.71, 11.25]], view: { at: [29.4, 9.9], look: [36.5, -2] } },
    { id: 'porch', name: 'Front porch', floor: 'concrete', outdoor: true, covered: true, polygon: [[19.94, 50.6], [26.6, 50.6], [26.6, 57.59], [38.69, 57.59], [38.69, 64.1], [19.94, 64.1]], labelAt: [24.8, 60.2], view: { at: [23.3, 62.0], look: [23.3, 50] }, chip: false },
  ],

  walls: [
    { from: [0, 0], to: [26.71, 0], exterior: true, openings: [
      { kind: 'window', at: 2.75, width: 2.5, sill: 2.2, head: 7.5 },
      { kind: 'window', at: 5.35, width: 2.5, sill: 2.2, head: 7.5 },
      { kind: 'window', at: 7.95, width: 2.5, sill: 2.2, head: 7.5 },
      { kind: 'window', at: 13.98, width: 2.5, sill: 2.0, head: 7.4 },
      { kind: 'window', at: 23.22, width: 2.5, sill: 2.0, head: 7.4 },
    ] },
    { from: [26.71, 0], to: [26.71, 11.25], exterior: true },
    { from: [26.71, 11.25], to: [38.69, 11.25], exterior: true, openings: [
      { kind: 'window', at: 1.54, width: 1.8, sill: 0.9, head: 6.67, panes: 1 },
      { kind: 'door', style: 'french', at: 3.39, width: 5, swingTowards: [32.7, 7] },
      { kind: 'window', at: 8.44, width: 1.8, sill: 0.9, head: 6.67, panes: 1 },
    ] },
    { from: [38.69, 11.25], to: [38.69, 57.59], exterior: true, openings: [
      { kind: 'window', at: 3.06, width: 1.9, sill: 5.4, head: 7.4, panes: 1 },
      { kind: 'window', at: 5.54, width: 1.9, sill: 5.4, head: 7.4, panes: 1 },
      { kind: 'window', at: 8.01, width: 1.9, sill: 5.4, head: 7.4, panes: 1 },
      { kind: 'window', at: 27.3, width: 3.9, sill: 4.3, head: 7.0, panes: 2 },
    ] },
    { from: [38.69, 57.59], to: [26.6, 57.59], exterior: true, openings: [{ kind: 'window', at: 3.58, width: 5, sill: 2.2, head: 7.3, panes: 2 }] },
    { from: [26.6, 50.6], to: [26.6, 57.59], exterior: true },
    { from: [19.94, 50.6], to: [26.6, 50.6], exterior: true, openings: [
      { kind: 'window', at: 0.26, width: 1.45, sill: 1.0, head: 6.67, panes: 1 },
      { kind: 'door', style: 'entry', at: 1.91, width: 3 },
      { kind: 'window', at: 5.11, width: 1.35, sill: 1.0, head: 6.67, panes: 1 },
    ] },
    { from: [19.94, 50.6], to: [19.94, 57.59], exterior: true },
    { from: [19.94, 57.59], to: [0, 57.59], exterior: true, openings: [{ kind: 'door', style: 'garage', at: 1.9, width: 16, head: 7 }] },
    { from: [0, 0], to: [0, 57.59], exterior: true, openings: [
      { kind: 'window', at: 18.7, width: 1.9, sill: 4.2, head: 7.0 },
      { kind: 'window', at: 23.03, width: 3.88, sill: 6.1, head: 7.6, panes: 2 },
    ] },

    { from: [13.02, 0], to: [13.02, 21.31], openings: [{ kind: 'door', style: 'cased', at: 15.83, width: 3.43 }] },
    { from: [0, 15.38], to: [13.02, 15.38], openings: [
      { kind: 'door', at: 5.46, width: 2.8, hinge: 'end', swingTowards: [7, 18] },
      { kind: 'door', at: 9.58, width: 2.8, hinge: 'end', swingTowards: [11, 12] },
    ] },
    { from: [8.88, 15.38], to: [8.88, 19.63] },
    { from: [8.88, 19.63], to: [13.02, 19.63] },
    { from: [12.15, 19.63], to: [12.15, 34.7] },
    { from: [12.15, 21.31], to: [19.94, 21.31] },
    { from: [4.16, 15.38], to: [4.16, 21.82], openings: [{ kind: 'door', at: 3.32, width: 2.4, hinge: 'end', swingTowards: [2, 19] }] },
    { from: [0, 21.82], to: [4.16, 21.82] },
    { from: [0, 28.06], to: [4.16, 28.06] },
    { from: [4.16, 28.06], to: [4.16, 29.05] },
    { from: [4.16, 29.05], to: [19.94, 29.05], openings: [
      { kind: 'door', at: 1.72, width: 2.8, hinge: 'end', swingTowards: [7, 31] },
      { kind: 'door', at: 12.35, width: 2.8, hinge: 'start', swingTowards: [17, 26] },
    ] },
    { from: [14.8, 29.05], to: [14.8, 34.7], openings: [{ kind: 'door', style: 'bifold', at: 0.95, width: 4, swingTowards: [17, 31.5] }] },
    { from: [0, 34.7], to: [19.94, 34.7], thickness: 0.5, openings: [{ kind: 'door', at: 16.06, width: 2.8, hinge: 'start', swingTowards: [17, 32] }] },
    { from: [19.94, 21.31], to: [19.94, 50.6], thickness: 0.5, openings: [{ kind: 'door', style: 'cased', at: 8.47, width: 4.22 }] },
    { from: [26.6, 34.6], to: [26.6, 37.68] },
    { from: [26.6, 37.68], to: [38.69, 37.68] },
    { from: [33.46, 32.62], to: [33.46, 37.68] },
    { from: [33.46, 32.62], to: [38.69, 32.62], openings: [{ kind: 'door', at: 0.14, width: 2.3, hinge: 'start', swingTowards: [35.5, 35] }] },
    { from: [26.6, 37.68], to: [26.6, 50.6], openings: [{ kind: 'door', style: 'cased', at: 2.28, width: 4.61 }] },
    { from: [26.6, 38.8], to: [30.14, 38.8], openings: [{ kind: 'door', style: 'entry', at: 0.6, width: 2.2 }] },
    { from: [30.14, 37.68], to: [30.14, 45.72], openings: [{ kind: 'door', at: 1.72, width: 2.5, hinge: 'end', swingTowards: [32, 40] }] },
    { from: [30.14, 43.22], to: [38.69, 43.22] },
    { from: [26.6, 45.72], to: [38.69, 45.72], openings: [
      { kind: 'door', at: 0.4, width: 2.8, hinge: 'start', swingTowards: [28, 48] },
      { kind: 'door', style: 'bifold', at: 5.0, width: 5.8, swingTowards: [34, 48] },
    ] },
  ],

  finishes: [
    { id: 'cabinets', label: 'Cabinets', options: [
      { id: 'white', label: 'Bright white', swatch: '#f2f0eb', cabinet: '#f2f0eb' },
      { id: 'dove', label: 'Dove gray', swatch: '#9a9b97', cabinet: '#9a9b97' },
      { id: 'navy', label: 'Deep navy', swatch: '#2f3d4c', cabinet: '#2f3d4c' },
    ] },
    { id: 'counters', label: 'Countertops', options: [
      { id: 'quartz', label: 'White quartz', swatch: '#efeeea', counter: 'quartz-white' },
      { id: 'granite', label: 'Beige granite', swatch: '#d4c3a3', counter: 'granite-beige' },
      { id: 'black', label: 'Black granite', swatch: '#262526', counter: 'granite-black' },
    ] },
    { id: 'floors', label: 'Hardwood', options: [
      { id: 'hickory', label: 'Saddle hickory', swatch: '#7a4f33', wood: { hue: 22, saturation: 40, lightness: 34 } },
      { id: 'oak', label: 'Natural oak', swatch: '#b48e62', wood: { hue: 32, saturation: 32, lightness: 52 } },
      { id: 'graywash', label: 'Gray wash', swatch: '#a39b91', wood: { hue: 34, saturation: 8, lightness: 57 } },
    ] },
    { id: 'paint', label: 'Wall paint', options: [
      { id: 'greige', label: 'Light greige', swatch: '#e3dfd7', paint: '#e3dfd7' },
      { id: 'white', label: 'Soft white', swatch: '#f1efea', paint: '#f1efea' },
      { id: 'sage', label: 'Sage', swatch: '#c6cbb5', paint: '#c6cbb5' },
    ] },
  ],

  surroundings: {
    slabs: [
      { x: 9.97, z: 71, width: 18.5, depth: 26, color: '#c9c6bf' },
      { x: 23.3, z: 66.3, width: 5, depth: 4.4, color: '#c9c6bf' },
      { x: 18, z: 93, width: 180, depth: 22, color: '#56595b' },
    ],
    trees: [[-12, -26], [16, -38], [46, -24], [-16, 73], [49, 75], [61, 44], [8, -60], [-30, 20], [71, 8], [-28, 52]],
  },

  furnish(kit, { ceilingHeight }) {
    const BLACK = '#1e1e1e';

    kit.add('rug', { x: 19.8, z: 9.0, width: 8.5, length: 6.5, color: '#b9b2a6', border: '#cbc5ba' });
    kit.add('fireplace', { x: 19.8, z: 0.85, facing: 'south', width: 5.35 });
    kit.box(kit.world.root, { width: 4.0, height: 12, depth: 2.06, x: 19.8, y: -1, z: -1.03, material: 'exterior' });
    kit.add('sofa', { x: 19.8, z: 13.4, facing: 'north', length: 7.5, fabric: '#c4bdb2', pillows: ['#2f3d4c', '#a8846a', '#e6dfd1'] });
    kit.add('armchair', { x: 15.5, z: 8.8, facing: 'east', fabric: '#8a8f7c' });
    kit.add('armchair', { x: 24.1, z: 8.8, facing: 'west', fabric: '#8a8f7c' });
    kit.add('coffeeTable', { x: 19.8, z: 9.0, length: 4.2, width: 2.2, top: '#6b4b34' });
    kit.add('sideTable', { x: 15.5, z: 12.8, size: 1.4 });
    kit.add('plant', { x: 25.7, z: 1.3, height: 5.5, seed: 5 });
    kit.add('ceilingFan', { x: 19.8, z: 8.2, ceiling: ceilingHeight, blades: BLACK, housing: '#2a2a2a' });
    kit.add('curtains', { x: 15.23, z: 0.25, facing: 'south', width: 2.9, panelWidth: 1.0, color: '#e9e5dc' });
    kit.add('curtains', { x: 24.47, z: 0.25, facing: 'south', width: 2.9, panelWidth: 1.0, color: '#e9e5dc' });
    for (const [x, z] of [[15.8, 4], [23.8, 4], [15.8, 18.8], [23.8, 18.8]]) {
      kit.add('canLight', { x, z, ceiling: ceilingHeight });
    }

    kit.add('diningTableRect', { x: 32.7, z: 17.6, length: 6, width: 3.3, wood: '#5e4331' });
    for (const offset of [-1.8, 0, 1.8]) {
      kit.add('diningChair', { x: 32.7 + offset, z: 15.35, facing: 'south', fabric: '#d8d2c6', frame: '#2b2b2b' });
      kit.add('diningChair', { x: 32.7 + offset, z: 19.85, facing: 'north', fabric: '#d8d2c6', frame: '#2b2b2b' });
    }
    kit.add('chandelier', { x: 32.7, z: 17.6, ceiling: ceilingHeight, drop: 2.8 });

    kit.add('baseRun', { x: 37.44, z: 28.15, facing: 'west', length: 8.56, backsplash: 1.55, splash: false });
    kit.add('cooktop', { x: 37.34, z: 27.98, facing: 'west' });
    kit.add('rangeHood', { x: 37.64, z: 27.98, facing: 'west', ceiling: ceilingHeight - 0.36 });
    kit.add('upperRun', { x: 37.94, z: 25.15, y: 4.55, facing: 'west', length: 2.56, height: 4.05 });
    kit.add('upperRun', { x: 37.94, z: 30.98, y: 4.55, facing: 'west', length: 2.9, height: 4.05 });
    kit.add('fridge', { x: 28.3, z: 36.13, facing: 'north', height: 6 });
    kit.add('upperRun', { x: 28.3, z: 36.43, y: 6.25, facing: 'north', length: 3.0, depth: 2, height: 2.35 });
    kit.add('wallOvens', { x: 31.9, z: 36.39, facing: 'north', width: 2.5, height: 8.6 });
    kit.add('baseRun', { x: 31.19, z: 27.75, facing: 'east', length: 6.86, depth: 2.25, sinkAt: -0.22, splash: false, gaps: [{ at: 2.05, width: 2, kind: 'dishwasher' }] });
    kit.add('counterSlab', { x: 29.58, z: 27.75, facing: 'east', length: 6.86, depth: 0.96 });
    for (const z of [25.6, 27.75, 29.9]) {
      kit.add('barStool', { x: 28.5, z, facing: 'east', seat: '#e9e4da', legs: '#2b2b2b' });
    }
    kit.add('pendant', { x: 30.7, z: 26.4, ceiling: ceilingHeight, drop: 3.3, globe: 0.45 });
    kit.add('pendant', { x: 30.7, z: 29.1, ceiling: ceilingHeight, drop: 3.3, globe: 0.45 });
    for (const [x, z] of [[24.8, 26.8], [24.8, 34.0], [35.0, 30.8], [27.0, 30.8]]) {
      kit.add('canLight', { x, z, ceiling: ceilingHeight });
    }
    kit.add('closetSystem', { x: 37.44, z: 35.15, facing: 'west', length: 4.6, shelvesOnly: true, seed: 3 });

    kit.add('rug', { x: 23.3, z: 44.0, width: 3, length: 8, color: '#8d7f70', border: '#a39686' });
    kit.add('consoleTable', { x: 20.75, z: 42.5, facing: 'east', length: 3.5, depth: 1.1 });
    kit.add('mirror', { x: 20.22, z: 42.5, y: 3.4, facing: 'east', width: 2.4, height: 2.4, round: true, frame: '#1e1e1e' });
    kit.add('flushLight', { x: 23.3, z: 41.5, ceiling: ceilingHeight, length: 1.4, width: 1.4 });
    kit.add('flushLight', { x: 23.3, z: 47.6, ceiling: ceilingHeight, length: 1.4, width: 1.4 });
    kit.add('flushLight', { x: 28.4, z: 42.2, ceiling: ceilingHeight, length: 1.2, width: 1.2 });

    kit.add('bed', { x: 3.9, z: 7.5, facing: 'east', size: 'king', frame: '#cfcac2', throwColor: '#7d8a8c' });
    kit.add('nightstand', { x: 1.0, z: 3.0, facing: 'east' });
    kit.add('nightstand', { x: 1.0, z: 12.0, facing: 'east' });
    kit.add('dresser', { x: 12.03, z: 7.5, facing: 'west', length: 5, color: '#e9e5de', pulls: '#1e1e1e' });
    kit.add('art', { x: 0.3, z: 7.5, y: 4.9, facing: 'east', width: 3.6, height: 2.2, palette: ['#eef0ec', '#8fa9a3', '#2f3d4c', '#d9cbb0'], seed: 51 });
    kit.add('ceilingFan', { x: 6.5, z: 7.6, ceiling: ceilingHeight, blades: BLACK, housing: '#2a2a2a' });

    kit.add('vanity', { x: 11.06, z: 22.9, facing: 'west', length: 5.6, sinks: 2 });
    kit.add('mirror', { x: 11.94, z: 22.9, y: 3.35, facing: 'west', width: 5, height: 3.4, frame: '#1e1e1e' });
    kit.add('vanityLight', { x: 11.94, z: 22.9, y: 7.15, facing: 'west', length: 4, bulbs: 4 });
    kit.add('upperRun', { x: 10.96, z: 27.43, facing: 'west', length: 2.8, depth: 2, height: 7.5 });
    kit.add('toilet', { x: 2.1, z: 16.82, facing: 'south' });
    kit.add('showerStall', { x: 2.17, z: 24.94, facing: 'east', width: 5.87, depth: 3.85, tileHeight: 6.0 });
    kit.add('rug', { x: 8.0, z: 23.0, width: 2.2, length: 3.2, color: '#c9c4ba' });

    kit.add('closetSystem', { x: 6.2, z: 33.45, facing: 'north', length: 11.4, seed: 21 });
    kit.add('closetSystem', { x: 1.25, z: 30.6, facing: 'east', length: 3.2, seed: 23 });

    kit.add('washerDryer', { x: 13.4, z: 22.8, facing: 'east' });
    kit.add('baseRun', { x: 13.35, z: 26.6, facing: 'east', length: 3.6, sinkAt: 0, backsplash: 1.5 });
    kit.add('upperRun', { x: 12.85, z: 26.6, y: 4.8, facing: 'east', length: 3.6, height: 3 });
    kit.add('closetSystem', { x: 13.3, z: 31.9, facing: 'east', length: 4.6, depth: 1.8, seed: 7 });

    kit.add('vanity', { x: 31.85, z: 38.77, facing: 'south', length: 3 });
    kit.add('mirror', { x: 31.85, z: 37.9, y: 3.4, facing: 'south', width: 2.6, height: 3 });
    kit.add('vanityLight', { x: 31.85, z: 37.94, y: 7.0, facing: 'south', length: 2.4 });
    kit.add('toilet', { x: 34.4, z: 39.12, facing: 'south' });
    kit.add('tub', { x: 37.19, z: 40.45, facing: 'west', length: 5.0, surround: false });
    kit.add('rug', { x: 34.6, z: 41.6, width: 1.6, length: 2.6, color: '#2f3d4c' });

    kit.add('bed', { x: 34.8, z: 51.6, facing: 'west', size: 'queen', frame: '#d5d0c8', throwColor: '#a8846a' });
    kit.add('nightstand', { x: 37.74, z: 48.0, facing: 'west', color: '#f0ece5' });
    kit.add('nightstand', { x: 37.74, z: 55.2, facing: 'west', color: '#f0ece5' });
    kit.add('dresser', { x: 27.65, z: 52.4, facing: 'east', length: 4.5, color: '#6b4b34' });
    kit.add('ceilingFan', { x: 32.6, z: 51.6, ceiling: ceilingHeight, blades: BLACK, housing: '#2a2a2a' });
    kit.add('closetSystem', { x: 34.4, z: 44.47, facing: 'south', length: 8, seed: 31 });

    kit.add('flushLight', { x: 9.8, z: 46.0, ceiling: ceilingHeight, length: 1.6, width: 1.6 });

    kit.add('column', { x: 38.3, z: 0.45 });
    kit.add('ceilingFan', { x: 32.7, z: 5.6, ceiling: ceilingHeight, blades: BLACK, housing: '#2a2a2a' });
    kit.add('armchair', { x: 30.9, z: 6.6, facing: 'north', fabric: '#8a6f55' });
    kit.add('armchair', { x: 34.5, z: 6.6, facing: 'north', fabric: '#8a6f55' });
    kit.add('sideTable', { x: 32.7, z: 6.6, size: 1.3, height: 1.7, lamp: false, top: '#3b3b3b', frame: '#2b2b2b' });

    kit.add('column', { x: 20.4, z: 63.6 });
    kit.add('column', { x: 38.3, z: 63.6 });
    kit.add('armchair', { x: 30.8, z: 60.6, facing: 'south', fabric: '#3f4a52' });
    kit.add('armchair', { x: 34.4, z: 60.6, facing: 'south', fabric: '#3f4a52' });
  },
};
