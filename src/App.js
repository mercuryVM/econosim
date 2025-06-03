import logo from './logo.svg';
import './App.css';
import { useClient } from './hooks/useClient';
import { Lobby } from './screens/Lobby';

function App() {
  const client = useClient();

  return (
    <div className="App">
      <Lobby />
    </div>
  );
}

export default App;
