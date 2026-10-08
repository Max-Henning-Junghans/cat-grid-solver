export const example = {
  size: 8,
  name: 'Garden puzzle',
  colors: ['#61b6a3', '#c18ade', '#dfad52', '#87b8dc', '#e88f8a', '#8cab63', '#738ed0', '#da91bb'],
  regions: [
    0,0,0,0,0,1,1,1,
    0,0,0,0,2,1,1,1,
    0,0,3,4,4,4,1,1,
    0,0,3,4,4,4,4,4,
    0,0,4,4,4,4,4,4,
    5,6,6,4,4,4,4,4,
    5,6,6,6,6,4,4,4,
    6,6,6,6,6,4,7,4,
  ],
  marks: Array(64).fill(0),
};

export const cloneBoard = board => ({ ...board, colors: [...board.colors], regions: [...board.regions], marks: [...board.marks], ...(board.suspected ? {suspected:[...board.suspected]} : {}) });
