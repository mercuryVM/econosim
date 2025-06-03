import { useClient } from "../hooks/useClient";
import styles from './Lobby.module.css';

export function Lobby() {
    const {client, playerState, gameState} = useClient();

    console.log('Lobby component rendered with client:', client);
    console.log('Player state:', playerState);
    console.log('Game state:', gameState);

    if(!client) {
        return (null)
    }

    return (
        <div className={styles.lobbyContainer}>
            {
                playerState && playerState.inLobby ? (
                    <LobbyContent client={client} playerState={playerState} gameState={gameState} />
                ) : (
                    <LobbyError />
                )
            }
        </div>
    )
}

function LobbyContent({client, playerState, gameState}) {
    console.log('LobbyContent rendered with client:', client);
    console.log('Player state:', playerState);
    console.log('Game state:', gameState);

    return (
        <div className={styles.lobby}>
            <h1>Lobby</h1>
            <p>Welcome, {client.nickname}!</p>
            <p>Your role: {client.role === 0 ? 'Bank' : 'Government'}</p>
            <PlayerList players={gameState.clients} />
        </div>
    );
}

function LobbyError() {
    return (
        <div className={styles.error}>
                        Loading
                    </div>
    )
}

function PlayerList({players}) {
    return (
        <ul className={styles.playerList}>
            {players.map((player, index) => (
                <li key={index} className={styles.playerItem}>
                    {player.nickname} - {player.role === 0 ? 'Bank' : 'Government'}
                </li>
            ))}
        </ul>
    );
}