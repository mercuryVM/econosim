import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import banco from '../assets/bancoCentral.png'
import bancoBg from '../assets/bancoBg.png'
import governo from '../assets/governo.png'
import governoBg from '../assets/governoBg.png'

export function Round({ client, gameState, playerState }) {
    return (
        <>
            <RoundNumber playerState={playerState} />
            <RoundBody client={client} gameState={gameState} playerState={playerState} />
        </>
    )
}

function RoundBody({ client, gameState, playerState }) {
    const [roundData, setRoundData] = useState(null);
    const [event, setEvent] = useState(null);

    useEffect(() => {
        if (playerState && playerState.round) {
            setRoundData(playerState.round);
        }
    }, [playerState]);

    useEffect(() => {
        if (roundData && roundData.event) {
            setEvent(roundData.event);
        }
    }, [roundData]);

    if (!roundData || !event) {
        return (
            <Paper>
                <Typography variant="h4" sx={{ padding: 2 }}>
                    Carregando dados da rodada...
                </Typography>
            </Paper>
        );
    }

    return (
        <Box display={"flex"} flexDirection={"column"} gap={2} sx={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            padding: 2,
            backgroundImage: `url(${playerState.entity.id === "banco" ? bancoBg : governoBg})`,
            backgroundSize: "cover",
            overflowY: "auto",
        }}>
            <Typography variant="h4" sx={{                backgroundColor: "#f5a623",
                color: "#fff",
                padding: "4px 16px",
                borderRadius: "4px",
                fontWeight: "bold",
                display: "inline-block",
                textAlign: "center",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
                textTransform: "uppercase",
                width: "calc(100% - 32px)",
                pt: "10px",
            }}>

                Rodada {roundData.numRound}
            </Typography>
            <Paper sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
            }}>
                <Typography variant="h4" sx={{ padding: 2 }} textAlign={"center"} marginTop={3}>
                    {
                        event.name
                    }
                </Typography>

                <Typography variant="subtitle1" sx={{ padding: 2 }} textAlign={"center"}>
                    {event.description}
                </Typography>


                {
                    roundData.roundEnded ? (
                        <RoundGameEnd gameState={gameState} />
                    ) : (
                        <RoundGameActions client={client} gameState={gameState} playerState={playerState} event={event} />
                    )
                }
            </Paper>
        </Box>
    )
}

function RoundGameActions({ client, gameState, playerState, event }) {
    const [voteDistribution, setVoteDistribution] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        if (client) {
            client.sendMessage('roundOptionSelected', selectedOption);
        }
    }, [client, selectedOption])

    useEffect(() => {
        if (client) {
            const onVotes = (votes) => {
                setVoteDistribution(votes);
            }
            client.on("votes", onVotes);

            return () => {
                client.off("votes", onVotes);
            }
        }
    }, [client]);

    return (
        <>
            <Box sx={{ textAlign: "center", padding: 2 }}>                <img
                    src={playerState.entity.id === "banco" ? banco : governo}
                    alt={playerState.entity.name}
                    style={{ width: "100px", height: "100px", marginBottom: "16px", borderRadius:"5px" }}
                />
                <Typography variant="h6">
                    Você é o {playerState.entity.name} do país {playerState.economy.country}.
                </Typography>
            </Box>
            <Typography variant="h6" sx={{ padding: 2, textAlign: "center" }}>
                Qual decisão você vai tomar?
            </Typography>            <Box sx={{ display: 'flex', flexDirection: 'column', padding: 2 }}>
                {event.options[playerState.entity.id].map((option, index) => {
                    const voteValue = voteDistribution ? (voteDistribution[index] || 0) : 0;

                    return (
                        <RoundOption playerState={playerState} onClick={() => {
                            if (selectedOption === index) {
                                setSelectedOption(null);
                                return;
                            }
                            setSelectedOption(index);
                        }} selected={selectedOption === index} key={index} description={option.description} voteValue={voteValue} />
                    )
                })}
            </Box>
        </>
    )
}

function RoundGameEnd({ gameState }) {
    return (
        <>
            <Typography variant="subtitle1" sx={{ padding: 2,  textAlign: "center"}}>
                Olhe o resultado da rodada no projetor e veja como as decisões afetaram o país.
            </Typography>
        </>
    )
}

function RoundNumber({ playerState }) {
    const [roundNumberShown, setRoundNumberShown] = useState(false);
    const round = playerState.round;
    const roundNumber = round ? round.numRound : 0;

    useEffect(() => {
        setTimeout(() => {
            setRoundNumberShown(true);
        }, 2000);
    }, [])

    return (
        <>
            {
                !roundNumberShown && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 9999,
                        }}
                    >
                        <Typography
                            variant="h1"
                            sx={{
                                color: "white",
                                fontWeight: 700,
                                fontSize: "4rem",
                                animation: "fadeScale 1s ease-in-out",
                                "@keyframes fadeScale": {
                                    "0%": { transform: "scale(0.5)", opacity: 0 },
                                    "50%": { transform: "scale(1.2)", opacity: 1 },
                                    "100%": { transform: "scale(1)", opacity: 1 },
                                },
                            }}
                            key={roundNumber}
                        >
                            Rodada {roundNumber}
                        </Typography>
                    </Box>
                )
            }
        </>
    )
}

function RoundOption({ playerState, onClick, description, selected, voteValue = 0 }) {
    return (
        <Box sx={{
            margin: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: "5px"
        }}>
            <Paper onClick={onClick} sx={{
                padding: 2, backgroundColor: selected ? (
                    playerState.entity.id === "banco" ? 'rgba(191, 216, 185, 0.8)' : 'rgba(155, 186, 211, 0.8)'
                ) : 'white', '&:hover': {
                    cursor: "pointer"
                }
            }}>
                <Typography sx={{
                    fontSize: "15px"
                }}>
                    {description}
                </Typography>


            </Paper>            <LinearProgress variant="determinate" color={playerState.entity.id === "banco" ? "success" : "primary"}
            value={voteValue} sx={{
                height: "12px",
                borderRadius: "30px"
            }} />

            <Typography variant="subtitle1" sx={{ marginTop: 1 }}>
                {voteValue.toFixed(2)}% de votos
            </Typography>
        </Box>
    );
}

