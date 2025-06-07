import { useClient } from "../hooks/useClient";
import { Lobby } from "./Lobby";

export function Client() {
    const { client, playerState, gameState } = useClient();

    return (
        <Lobby client={client} playerState={playerState} gameState={gameState} />
    )
}