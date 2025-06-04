import logo from './logo.svg';
import './App.css';
import { useClient } from './hooks/useClient';
import { Lobby } from './screens/Lobby';
import { Logo } from './components/logo';
import { BrowserRouter, Route, Router, Routes } from 'react-router';
import { Server } from './screens/Server';

function App() {
  return (
    <div className="App">
      <Header />
      <div className='content'>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/server" element={<Server />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="header">
      <Logo />
    </div>
  )
}

export default App;
