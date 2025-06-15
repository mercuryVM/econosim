import { useClient } from "../hooks/useClient";
import { Lobby } from "./Lobby";
import { Round } from "./Client/Round";
import { useSearchParams } from "react-router";
import { useEffect } from "react";

export function Client() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");
    const economy = searchParams.get("economy");

    const { client, playerState, gameState } = useClient(role, economy);

    useEffect(() => {        return () => {
            if (client) {
                client.disconnect();
            }
        }
    }, [client])

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