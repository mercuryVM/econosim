import './App.css';
import { BrowserRouter, Route, Router, Routes } from 'react-router';
import { Server } from './screens/Server';
import { Client } from './screens/Client';

function App() {
  return (
    <div className="App">
      <div className='content'>
        <div className={"bg"} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Client />} />
            <Route path="/server" element={<Server />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
