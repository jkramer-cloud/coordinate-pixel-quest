/* Coordinate Pixel Quest — original, self-contained puzzle data. Each character is one colored grid CELL. */
window.CPQ = Object.freeze({
  version:'1.0.0',
  palette: {
    Y:{name:'Sun Gold',hex:'#f5c85e'},W:{name:'Moon Cream',hex:'#fff1c4'},B:{name:'Wood Brown',hex:'#a96c48'},
    G:{name:'Leaf Green',hex:'#5fce8c'},L:{name:'Lime',hex:'#b6ec76'},R:{name:'Coral Red',hex:'#f17879'},
    D:{name:'Deep Navy',hex:'#2a4567'},P:{name:'Royal Purple',hex:'#ac8be3'},C:{name:'Sky Blue',hex:'#77d5ea'}
  },
  quests:[
    {id:'lamp',title:'The Sun Lantern',region:'Meadow',icon:'✦',x:7,y:7,need:[],reward:65,story:'The village paths are fading. Restore the lantern so everyone can find their way again.',lesson:'Start with an 8×8 grid. X goes right; Y goes UP.',pattern:[
      '...YY...', '..YYYY..', '..YWWY..', '..YWWY..', '..YWWY..', '..YYYY..', '...BB...', '..BBBB..'
    ]},
    {id:'tree',title:'The Blooming Oak',region:'Meadow',icon:'♣',x:11,y:4,need:[],reward:75,story:'The giant oak has lost its colors. Bring its leaves back, one plotted square at a time.',lesson:'Remember: (1,1) is the BOTTOM-LEFT cell.',pattern:[
      '...LL...', '..LGGL..', '.LGGGGL.', 'LGGGGGGL', '.LGGGGL.', '...BB...', '...BB...', '..BBBB..'
    ]},
    {id:'robot',title:'The Friendly Automaton',region:'Meadow',icon:'⚙',x:9,y:14,need:[],reward:90,story:'An old helper robot is waiting for a fresh coat of pixels and a new purpose.',lesson:'Larger grids need more careful counting.',pattern:[
      '..DDDDDD..', '..DWWWWD..', '..DCWWCD..', '..DWWWWD..', '..DDDDDD..', '...RRRR...', '..RRRRRR..', '..R.RR.R..', '..R....R..', '.BB....BB.'
    ]},
    {id:'bridge',title:'The Golden Bridge',region:'Crossing',icon:'═',x:15,y:9,need:['lamp','tree','robot'],reward:140,story:'The east river is impassable. Rebuild the bridge to open the rest of Pixel Valley!',lesson:'Coordinate sequences reveal repeating patterns.',pattern:[
      '..........', 'RRRRRRRRRR', 'YYYYYYYYYY', 'BBBBBBBBBB', 'BBBBBBBBBB', 'BBBBBBBBBB', 'YYYYYYYYYY', 'RRRRRRRRRR', '..........', '..........'
    ]},
    {id:'boat',title:'The River Skiff',region:'Eastern Wilds',icon:'◈',x:22,y:7,need:['bridge'],reward:100,story:'A little river boat is missing from the docks. Paint it back into existence.',lesson:'The ordered pair is always (X,Y), not (Y,X).',pattern:[
      '....YY....', '....YY....', '...CYY....', '..CCYY....', '.CCCYY....', 'CCCCCYY...', '...BBBB...', '.BBBBBBBB.', '..RRRRRR..', '..........'
    ]},
    {id:'windmill',title:'The Hilltop Windmill',region:'Eastern Wilds',icon:'✣',x:25,y:4,need:['bridge'],reward:110,story:'The eastern farms need their windmill spinning again.',lesson:'Follow rows and columns to avoid reversing coordinates.',pattern:[
      '....WW....', '..WWWWWW..', '....YY....', 'GGGYYYYGGG', '....YY....', '...BB.B...', '...BB.B...', '..BBBBBB..', '..BWWWWB..', '.BBBBBBBB.'
    ]},
    {id:'portal',title:'The Starlight Portal',region:'Star Ridge',icon:'◇',x:26,y:13,need:['boat','windmill'],reward:170,story:'Restore the glowing portal to reconnect the valley with the night sky.',lesson:'A 12×12 grid challenges your precision and patience.',pattern:[
      '....PPPP....', '...PCCCCP...', '..PCWGGWCP..', '.PCGGGGGGCP.', 'PCGGYYYYGGCP', 'PCCWYYYYWCCP', 'PCCWYYYYWCCP', 'PCGGYYYYGGCP', '.PCGGGGGGCP.', '..PCWGGWCP..', '...PCCCCP...', '....PPPP....'
    ]},
    {id:'festival',title:'Festival of Stars',region:'Star Ridge',icon:'★',x:22,y:15,need:['portal'],reward:220,story:'One final constellation of color will bring the grand Pixel Festival back!',lesson:'Finish the master pattern. Every coordinate counts.',pattern:[
      '.....Y......', '....YYY.....', '...YYYYY....', '.YYYYYYYYY..', '..YYYYYYY...', '...YYYYY....', '..RRYYYRR...', '.RR.RYR.RR..', 'RR..BBB..RR.', '....BBB.....', '...B...B....', '..B.....B...'
    ]}
  ]
});
