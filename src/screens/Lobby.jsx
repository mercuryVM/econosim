import { Box, Paper, Typography } from "@mui/material";
import styles from './Lobby.module.css';
import { stringToEmoji } from "../utils";
import Twemoji from "react-twemoji";
import Logo from './assets/econosim_logo_1.svg';

export function Lobby({ client, playerState, gameState }) {
    if (!client) {
        return (null)
    }

    return (
        <>
    
            <div className={styles.lobbyContent}>
                {
                playerState && playerState.inLobby ? (
                    <LobbyContent client={client} playerState={playerState} gameState={gameState} />
                ) : (
                    <LobbyError />
                )
            }
            </div>
        </>
    )
}

function LobbyContent({ client, playerState, gameState }) {
    const myEntity = playerState?.gameState?.economies?.[playerState.myEconomyIndex]?.[playerState.myEntityIndex];

    return (
        <>
            <Box justifyContent={'center'} flex={1} className={styles.lobbyBox} display={"flex"} flexDirection={"column"} gap={2}>
                <img src={Logo} alt="Econosim Logo" className={styles.logo} />

                <Paper sx={{
                    padding: "16px",
                    margin: "0 auto",
                    width: "fit-content",
                    marginBottom: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <Typography variant="h4" component="h1" className={styles.title} textAlign={"center"}>
                        {playerState.economy.flag} {playerState.economy.country}
                    </Typography>

                    <Typography variant="h6" component="h2" className={styles.subtitle} textAlign={"center"}>
                        {playerState.entity.name}
                    </Typography>
                </Paper>

                <PlayerList players={myEntity.players} />


            </Box>
            <Box position={"fixed"} sx={{
                bottom: 0,
                left: 0,
                right: 0,
                padding: "10px",
                backgroundColor: "rgb(164 164 164)",
                boxShadow: "0px -2px 4px rgba(0, 0, 0, 0.1)",
            }}>
                <Typography variant="body1" textAlign={"center"} color={"black"} fontWeight={"bold"} sx={{ textShadow: "0 0 5px white" }} className={styles.waitingText}>
                    Aguardando início do jogo...
                </Typography>
            </Box>
        </>
    );
}

function LobbyError() {
    return (
        <div className={styles.error}>
            Loading
        </div>
    )
}

function PlayerList({ players }) {
    const array = [];

    for (let i = 0; i < 20; i++) {
        array.push({
            nickname: `Player ${i + 1}`
        })
    }

    return (
        <Box margin={"0% 10%"} display={"flex"} flexDirection={"row"} alignItems={"center"} justifyContent={"center"} flexWrap={"wrap"} gap={2} className={styles.playerList}>
            {
                players && players.map((player, index) => {
                    const emoji = stringToEmoji(player.nickname);

                    return (
                        <Paper sx={{
                            borderRadius: 10,
                            padding: "8px 24px",
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                            flex: "0 1 150px",
                            display: "flex",
                            alignItems: "center",
                            gap: "24px"

                        }} key={index} className={styles.playerCard}>
                            <Twemoji options={{ className: styles.emoji }}>{emoji}</Twemoji>
                            <Typography variant="body1" textAlign={"center"} fontWeight={900} textTransform={"uppercase"}>
                                {player.nickname}
                            </Typography>
                        </Paper>
                    )
                }

                )
            }
        </Box>
    );
}