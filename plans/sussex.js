// MAA 1225 "Sussex" (2 bed, 2 bath, 1,076 sq ft), 1225 S Church St, Charlotte NC.
// Traced from MAA's published floor plan image: living 23'7" x 13'4", bedroom 2 10'6" x 13',
// primary bedroom 10'6" x 12'10". The traced footprint measures 1,078 sq ft. Finishes follow
// MAA's renovated-unit photos (slate shaker cabinets, beige granite, honey oak plank floors).

const PLAN = {
  name: 'Sussex',
  eyebrow: 'MAA 1225 · South End, Charlotte',
  specs: '2 bed · 2 bath · 1,076 sq ft',
  note: "Built to scale from MAA's published Sussex floor plan. Independent concept demo, not affiliated with MAA.",
  ceilingHeight: 9,
  startRoom: 'hall',
  overview: { azimuth: -0.38, polar: 0.72 },
  sun: [-0.5, 0.78, -0.62],

  rooms: [
    { id: 'living', name: 'Living', dimensions: '23\'7" × 13\'4"', floor: 'wood', polygon: [[9.4, 0], [22.7, 0], [22.7, 10], [21.1, 11.6], [11, 11.6], [9.4, 10]], view: { at: [16.05, 14.2], look: [16.05, 2] } },
    { id: 'dining', name: 'Dining', floor: 'wood', polygon: [[11, 11.6], [21.1, 11.6], [21.1, 23.6], [11, 23.6]], view: { at: [16.05, 3.6], look: [16.05, 22] } },
    { id: 'kitchen', name: 'Kitchen', floor: 'wood', polygon: [[16, 23.6], [21.1, 23.6], [21.1, 24], [24.8, 24], [24.8, 33.4], [16, 33.4]], labelAt: [19.6, 28.6], view: { at: [15.2, 28.4], look: [23, 29.4] } },
    { id: 'hall', name: 'Entry', chipName: 'Entry', floor: 'wood', polygon: [[11, 23.6], [16, 23.6], [16, 40], [11, 40]], labelAt: [13.5, 36], view: { at: [13.5, 38.1], look: [13.5, 20] } },
    { id: 'primary', name: 'Primary bedroom', dimensions: '10\'6" × 12\'10"', floor: 'carpet', polygon: [[21.7, 11], [32.1, 11], [32.1, 24], [21.1, 24], [21.1, 11.6]], view: { at: [22.4, 22.6], look: [29, 15] }, alsoCovers: ['primaryCloset'] },
    { id: 'primaryCloset', name: 'Walk-in closet', floor: 'carpet', polygon: [[24.8, 24], [32.1, 24], [32.1, 33.4], [24.8, 33.4]], view: { at: [28.3, 25.4], look: [28.3, 33] }, chip: false },
    { id: 'primaryBath', name: 'Primary bath', floor: 'tile', polygon: [[19.6, 33.4], [32.1, 33.4], [32.1, 40], [19.6, 40]], labelAt: [25.9, 36.5], view: { at: [27.3, 35.4], look: [20.8, 38.6] } },
    { id: 'utility', name: 'Utility', floor: 'tile', polygon: [[16, 33.4], [19.6, 33.4], [19.6, 40], [16, 40]], label: false },
    { id: 'bedroom2', name: 'Bedroom 2', dimensions: '10\'6" × 13\'', floor: 'carpet', polygon: [[0, 11], [10.4, 11], [11, 11.6], [11, 24.2], [0, 24.2]], view: { at: [9.7, 22.7], look: [2.5, 15.5] } },
    { id: 'vanity2', name: 'Vanity', floor: 'tile', polygon: [[0, 24.2], [4.6, 24.2], [4.6, 31.4], [0, 31.4]], label: false },
    { id: 'closet2', name: 'Closet', floor: 'carpet', polygon: [[4.6, 24.2], [8.4, 24.2], [8.4, 31.4], [4.6, 31.4]], label: false },
    { id: 'laundry', name: 'W/D', floor: 'tile', polygon: [[8.4, 24.2], [11, 24.2], [11, 27.8], [8.4, 27.8]], label: false },
    { id: 'linen', name: 'Linen', floor: 'wood', polygon: [[8.4, 27.8], [11, 27.8], [11, 31.4], [8.4, 31.4]], label: false },
    { id: 'bath2', name: 'Bath 2', floor: 'tile', polygon: [[0, 31.4], [11, 31.4], [11, 40], [0, 40]], labelAt: [5.6, 34.6], view: { at: [9.6, 33.7], look: [2, 36.5] }, alsoCovers: ['vanity2'] },
    { id: 'balconyWest', name: 'Balcony', floor: 'concrete', outdoor: true, polygon: [[1.8, 5.5], [9.4, 5.5], [9.4, 10], [10.4, 11], [1.8, 11]], view: { at: [5.6, 9.9], look: [5.6, -12] } },
    { id: 'balconyEast', name: 'Balcony', floor: 'concrete', outdoor: true, polygon: [[22.7, 5.5], [30.3, 5.5], [30.3, 11], [21.7, 11], [22.7, 10]], view: { at: [26.9, 9.9], look: [26.9, -12] }, chip: false },
  ],

  walls: [
    { from: [9.4, 0], to: [22.7, 0], exterior: true, openings: [
      { kind: 'window', at: 2.15, width: 2.9, sill: 1.5, head: 7.6, panes: 1 },
      { kind: 'window', at: 5.2, width: 2.9, sill: 1.5, head: 7.6, panes: 1 },
      { kind: 'window', at: 8.25, width: 2.9, sill: 1.5, head: 7.6, panes: 1 },
    ] },
    { from: [22.7, 0], to: [22.7, 10], exterior: true },
    { from: [9.4, 0], to: [9.4, 10], exterior: true },
    { from: [0, 11], to: [10.4, 11], exterior: true, openings: [{ kind: 'door', style: 'french', at: 2.7, width: 5, swingTowards: [5, 8] }] },
    { from: [21.7, 11], to: [32.1, 11], exterior: true, openings: [{ kind: 'door', style: 'french', at: 2.7, width: 5, swingTowards: [27, 8] }] },
    { from: [0, 11], to: [0, 40], exterior: true },
    { from: [32.1, 11], to: [32.1, 40], exterior: true },
    { from: [0, 40], to: [32.1, 40], exterior: true, openings: [{ kind: 'door', style: 'entry', at: 12, width: 3 }] },
    { from: [9.4, 10], to: [11, 11.6] },
    { from: [22.7, 10], to: [21.1, 11.6] },
    { from: [11, 11.6], to: [11, 24.2], openings: [{ kind: 'door', at: 9, width: 2.67, hinge: 'end', swingTowards: [8, 22] }] },
    { from: [21.1, 11.6], to: [21.1, 24], openings: [{ kind: 'door', at: 9, width: 2.67, hinge: 'end', swingTowards: [24, 22] }] },
    { from: [0, 24.2], to: [11, 24.2], openings: [
      { kind: 'door', at: 1.8, width: 2.4, hinge: 'end', swingTowards: [2, 27] },
      { kind: 'door', style: 'cased', at: 5.4, width: 2.4 },
    ] },
    { from: [4.6, 24.2], to: [4.6, 31.4] },
    { from: [8.4, 24.2], to: [8.4, 31.4] },
    { from: [8.4, 27.8], to: [11, 27.8] },
    { from: [11, 24.2], to: [11, 40], openings: [
      { kind: 'door', style: 'bifold', at: 0.3, width: 3, swingTowards: [13, 26] },
      { kind: 'door', style: 'bifold', at: 3.9, width: 3, swingTowards: [13, 29.5] },
      { kind: 'door', at: 8, width: 2.67, hinge: 'start', swingTowards: [8, 33.5] },
    ] },
    { from: [0, 31.4], to: [11, 31.4], openings: [{ kind: 'door', style: 'cased', at: 1, width: 2.6 }] },
    { from: [21.1, 24], to: [32.1, 24], openings: [{ kind: 'door', at: 4.9, width: 2.67, hinge: 'end', swingTowards: [27, 27] }] },
    { from: [24.8, 24], to: [24.8, 33.4] },
    { from: [16, 33.4], to: [32.1, 33.4], openings: [{ kind: 'door', at: 10, width: 2.67, hinge: 'end', swingTowards: [27, 36] }] },
    { from: [16, 30.4], to: [16, 40], openings: [{ kind: 'door', at: 4.6, width: 2.5, hinge: 'start', swingTowards: [18, 36] }] },
    { from: [19.6, 33.4], to: [19.6, 40] },
    { from: [5.4, 37], to: [5.4, 40], extendStart: 0 },
    { from: [25.2, 37], to: [25.2, 40], extendStart: 0 },
  ],

  finishes: [
    { id: 'cabinets', label: 'Cabinets', options: [
      { id: 'slate', label: 'Slate gray', swatch: '#6b707a', cabinet: '#6b707a' },
      { id: 'espresso', label: 'Espresso', swatch: '#3b2b23', cabinet: '#3b2b23' },
      { id: 'white', label: 'Shaker white', swatch: '#efebe4', cabinet: '#efebe4' },
    ] },
    { id: 'counters', label: 'Countertops', options: [
      { id: 'granite', label: 'Beige granite', swatch: '#d4c3a3', counter: 'granite-beige' },
      { id: 'quartz', label: 'White quartz', swatch: '#efeeea', counter: 'quartz-white' },
      { id: 'black', label: 'Black granite', swatch: '#262526', counter: 'granite-black' },
    ] },
    { id: 'floors', label: 'Plank floors', options: [
      { id: 'honey', label: 'Honey oak', swatch: '#8b6c55', wood: { hue: 25, saturation: 24, lightness: 39 } },
      { id: 'ash', label: 'Ash gray', swatch: '#a39b91', wood: { hue: 34, saturation: 9, lightness: 60 } },
      { id: 'walnut', label: 'Walnut', swatch: '#5e4433', wood: { hue: 24, saturation: 30, lightness: 30 } },
    ] },
    { id: 'paint', label: 'Wall paint', options: [
      { id: 'greige', label: 'Warm greige', swatch: '#e4d9c8', paint: '#e4d9c8' },
      { id: 'white', label: 'Soft white', swatch: '#f1efea', paint: '#f1efea' },
      { id: 'sage', label: 'Sage', swatch: '#c6cbb5', paint: '#c6cbb5' },
    ] },
  ],

  surroundings: {
    buildings: [
      { x: 16, z: -78, width: 150, depth: 30, height: 44 },
      { x: -62, z: 10, width: 30, depth: 150, height: 44 },
      { x: 94, z: 10, width: 30, depth: 150, height: 44 },
    ],
    trees: [[-4, -30], [18, -40], [40, -28], [58, -44], [-26, -46], [70, -18], [-38, -22]],
  },

  furnish(kit, { ceilingHeight }) {
    const TEAL = '#2b6e78';
    const NAVY = '#1f4a6b';
    const GOLD_ART = ['#e8dcc4', '#c6a35a', '#d9c497', '#f4efe4', '#b88f4a'];

    kit.add('rug', { x: 17.3, z: 6.1, width: 7.4, length: 7.2, color: '#8e8f8c', border: '#a3a4a0' });
    kit.add('sofa', { x: 20.85, z: 6.3, facing: 'west', length: 7, fabric: '#a7aaa9', pillows: [NAVY, NAVY, '#e6dfd1'] });
    kit.add('coffeeTable', { x: 17.4, z: 6.3, facing: 'west', length: 4, width: 2 });
    kit.add('tvConsole', { x: 10.45, z: 6.3, facing: 'east', length: 5.5 });
    kit.add('sideTable', { x: 21.4, z: 1.9 });
    kit.add('plant', { x: 10.5, z: 1.3, height: 5.5 });
    kit.add('curtains', { x: 16.05, z: 0.25, facing: 'south', width: 10.2, color: '#d9d6d0' });
    kit.add('trackLight', { x: 16.05, z: 6, ceiling: ceilingHeight });
    for (const [z, y] of [[5.45, 3.7], [7.15, 3.7], [5.45, 5.45], [7.15, 5.45]]) {
      kit.add('art', { x: 22.38, z, y, facing: 'west', width: 1.6, height: 1.6, palette: GOLD_ART, seed: Math.round(z * y), mat: false });
    }

    kit.add('diningTableRound', { x: 16.05, z: 17.2 });
    kit.add('diningChair', { x: 16.05, z: 14.75, facing: 'south' });
    kit.add('diningChair', { x: 16.05, z: 19.65, facing: 'north' });
    kit.add('diningChair', { x: 13.6, z: 17.2, facing: 'east' });
    kit.add('diningChair', { x: 18.5, z: 17.2, facing: 'west' });
    kit.add('pendant', { x: 16.05, z: 17.2, ceiling: ceilingHeight, drop: 2.4 });
    kit.add('consoleTable', { x: 11.85, z: 14.6, facing: 'east', length: 3.5 });
    kit.add('mirror', { x: 11.24, z: 14.6, y: 3.2, facing: 'east', width: 2.6, height: 2.6, round: true, frame: '#c6a35a' });
    kit.add('art', { x: 20.86, z: 16.4, y: 3.9, facing: 'west', width: 2.4, height: 3, palette: ['#f3efe6', '#2b6e78', '#d7c9ae', '#1f3d4a'], seed: 12 });

    kit.add('baseRun', { x: 20.1, z: 25.2, facing: 'south', length: 9, sinkAt: -1.5, splash: false, gaps: [{ at: 1, width: 2, kind: 'dishwasher' }] });
    kit.add('counterSlab', { x: 18.3, z: 23.7, length: 5.4, depth: 1.0 });
    kit.add('barStool', { x: 16.9, z: 22.55, facing: 'south' });
    kit.add('barStool', { x: 18.9, z: 22.55, facing: 'south' });
    kit.add('baseRun', { x: 23.6, z: 28.7, facing: 'west', length: 5, gaps: [{ at: 0.75, width: 2.5, kind: 'range' }] });
    kit.add('range', { x: 23.55, z: 29.45, facing: 'west' });
    kit.add('baseRun', { x: 21.9, z: 32.2, facing: 'north', length: 5.4 });
    kit.add('fridge', { x: 17.7, z: 31.9, facing: 'north' });
    kit.add('upperRun', { x: 24.1, z: 27.2, y: 4.5, facing: 'west', length: 2 });
    kit.add('upperRun', { x: 24.1, z: 31.45, y: 4.5, facing: 'west', length: 1.5 });
    kit.add('upperRun', { x: 21.9, z: 32.7, y: 4.5, facing: 'north', length: 5.4 });
    kit.add('microwave', { x: 23.95, z: 29.45, y: 4.95, facing: 'west' });
    kit.add('upperRun', { x: 24.1, z: 29.45, y: 6.45, facing: 'west', length: 2.5, height: 1.05 });
    kit.add('upperRun', { x: 17.7, z: 32.2, y: 6.25, facing: 'north', length: 3, depth: 2, height: 1.25 });
    kit.add('flushLight', { x: 19.6, z: 28.6, ceiling: ceilingHeight });

    kit.add('flushLight', { x: 13.5, z: 28, ceiling: ceilingHeight, length: 1.4, width: 1.4 });
    kit.add('flushLight', { x: 13.5, z: 36.4, ceiling: ceilingHeight, length: 1.4, width: 1.4 });
    kit.add('art', { x: 15.75, z: 32.6, y: 3.9, facing: 'west', width: 1.8, height: 2.4, palette: ['#efe9dd', '#b88f4a', '#7e8f86', '#d6c7aa'], seed: 21 });

    kit.add('bed', { x: 28.25, z: 17.7, facing: 'west', size: 'queen', frame: '#c9c6c0', throwColor: '#9a9aa0' });
    kit.add('nightstand', { x: 31.15, z: 13.9, facing: 'west' });
    kit.add('nightstand', { x: 31.15, z: 21.5, facing: 'west' });
    kit.add('dresser', { x: 22.15, z: 16, facing: 'east', length: 5 });
    kit.add('tableLamp', { x: 22.2, z: 14.2, y: 2.8 });
    for (const [index, z] of [14.6, 16.0, 17.4].entries()) {
      kit.add('art', { x: 21.32, z, y: 4.3, facing: 'east', width: 1.1, height: 1.4, palette: ['#f6f2ea', '#d24f5f', '#3b6ea8', '#e8c35b'], seed: 30 + index, frame: '#c6a35a' });
    }
    kit.add('armchair', { x: 23.2, z: 13.0, facing: 45, fabric: '#44593a' });
    kit.add('ceilingFan', { x: 26.5, z: 17.7, ceiling: ceilingHeight });

    kit.add('closetSystem', { x: 26.0, z: 28.7, facing: 'east', length: 8, seed: 4 });
    kit.add('closetSystem', { x: 30.9, z: 28.7, facing: 'west', length: 8.6, seed: 8 });
    kit.add('flushLight', { x: 28.4, z: 28.7, ceiling: ceilingHeight, length: 1.2, width: 1.2 });

    kit.add('tub', { x: 22.4, z: 38.5, facing: 'north', length: 5.2 });
    kit.add('toilet', { x: 30.6, z: 34.85, facing: 'south' });
    kit.add('vanity', { x: 28.9, z: 38.85, facing: 'north', length: 5.6, sinks: 2 });
    kit.add('mirror', { x: 28.9, z: 39.72, y: 3.4, facing: 'north', width: 5, height: 3.2 });
    kit.add('vanityLight', { x: 28.9, z: 39.68, y: 7.1, facing: 'north', length: 3.6, bulbs: 4 });
    kit.add('rug', { x: 28.4, z: 36.9, width: 2.6, length: 1.6, color: TEAL });
    kit.add('towelBar', { x: 22.4, z: 33.66, facing: 'south', length: 2.2 });

    kit.add('waterHeater', { x: 18.6, z: 36.9 });
    kit.add('airHandler', { x: 17.35, z: 38.75, facing: 'north' });

    kit.add('bed', { x: 3.9, z: 18.3, facing: 'east', size: 'queen', frame: '#d5d0c8', throwColor: '#7f8c8d' });
    kit.add('nightstand', { x: 0.95, z: 14.6, facing: 'east', color: '#f0ece5' });
    kit.add('nightstand', { x: 0.95, z: 22.0, facing: 'east', color: '#f0ece5' });
    kit.add('dresser', { x: 10.0, z: 15.5, facing: 'west', length: 4.5, color: '#f0ece5', pulls: '#b08d57' });
    kit.add('art', { x: 0.3, z: 18.3, y: 4.7, facing: 'east', width: 3.4, height: 2.2, palette: ['#eef0ec', '#8fa9a3', '#2b6e78', '#d9cbb0'], seed: 41 });
    kit.add('plant', { x: 9.7, z: 12.4, height: 4.2, seed: 9 });
    kit.add('ceilingFan', { x: 5.4, z: 17.7, ceiling: ceilingHeight });

    kit.add('vanity', { x: 1.15, z: 27.8, facing: 'east', length: 3.6 });
    kit.add('mirror', { x: 0.3, z: 27.8, y: 3.4, facing: 'east', width: 3.2, height: 3 });
    kit.add('vanityLight', { x: 0.34, z: 27.8, y: 7.0, facing: 'east', length: 2.6 });
    kit.add('closetSystem', { x: 7.21, z: 27.8, facing: 'west', length: 6.4, seed: 12 });
    kit.add('washerDryer', { x: 9.65, z: 26.0, facing: 'east' });
    kit.add('closetSystem', { x: 9.7, z: 29.6, facing: 'east', length: 3, shelvesOnly: true, seed: 6 });

    kit.add('toilet', { x: 1.5, z: 36.0, facing: 'east' });
    kit.add('vanity', { x: 1.15, z: 33.0, facing: 'east', length: 2.6 });
    kit.add('mirror', { x: 0.3, z: 33.0, y: 3.4, facing: 'east', width: 2.4, height: 3 });
    kit.add('tub', { x: 8.2, z: 38.5, facing: 'north', length: 5.2 });
    kit.add('towelBar', { x: 6.6, z: 31.66, facing: 'south' });
    kit.add('rug', { x: 8.2, z: 36.4, width: 2.6, length: 1.6, color: TEAL });

    kit.add('railing', { x: 5.6, z: 5.6, facing: 'south', length: 7.6 });
    kit.add('railing', { x: 1.9, z: 8.25, facing: 'east', length: 5.5 });
    kit.add('railing', { x: 26.5, z: 5.6, facing: 'south', length: 7.6 });
    kit.add('railing', { x: 30.2, z: 8.25, facing: 'west', length: 5.5 });
    kit.add('bistroSet', { x: 5.4, z: 7.6 });
    kit.add('bistroSet', { x: 26.9, z: 7.6 });
    kit.add('plant', { x: 8.6, z: 6.4, height: 3, seed: 14 });
  },
};
