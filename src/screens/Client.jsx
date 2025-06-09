import { useClient } from "../hooks/useClient";
import { Lobby } from "./Lobby";
import styles from './Client.module.css';
import { Round } from "./Client/Round";
import { useSearchParams } from "react-router";

export function Client() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");
    const economy = searchParams.get("economy");

    const { client, playerState, gameState } = useClient(role, economy);

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