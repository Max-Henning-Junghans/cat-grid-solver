import {generatePuzzle} from './generator.js';

self.onmessage=({data})=>{
  try {
    const result=generatePuzzle({...data,onProgress:progress=>self.postMessage({type:'progress',...progress})});
    self.postMessage({type:'complete',result});
  } catch(error) {
    self.postMessage({type:'error',code:error.code||'generationError'});
  }
};
