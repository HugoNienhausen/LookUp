import React from 'react';
import SimpleViewer from './SimpleViewer';
import './App.css';

function App() {
  return (
    <div className="App">
      <SimpleViewer dziUrl="https://lookuphack.s3.eu-north-1.amazonaws.com/fotos/PIA26080_Anaglyph_dz.dzi" />
    </div>
  );
}

export default App;
