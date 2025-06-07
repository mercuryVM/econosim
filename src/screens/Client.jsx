import { useClient } from "../hooks/useClient";
import { Lobby } from "./Lobby";
import styles from './Client.module.css';
import { Round } from "./Client/Round";

export function Client() {
    const { client, playerState, gameState } = useClient();

    return (
        <>
            {gameState && !gameState.started ? (
                <Lobby client={client} playerState={playerState} gameState={gameState} />
            ) : null}

            {gameState && gameState.started ? (
                <Round client={client} gameState={gameState} playerState={playerState} />
            ) : null}

        </>

    )
}