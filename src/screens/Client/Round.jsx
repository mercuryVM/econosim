import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { useEffect, useState } from 'react';

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
        <>
            <Typography variant="h3" sx={{ padding: 2 }}>
                Rodada {roundData.numRound}
            </Typography>
            <Paper>
                <Typography variant="h4" sx={{ padding: 2 }}>
                    {
                        event.name
                    }
                </Typography>

                <Typography variant="subtitle1" sx={{ padding: 2 }}>
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
        </>
    )
}

function RoundGameActions({ client, gameState, playerState, event }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [voteDistribution, setVoteDistribution] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        if (client) {
            client.sendMessage('roundOptionSelected', selectedOption);
        }
    }, [client, selectedOption])

    useEffect(() => {
        if (client) {
            client.on("votes", (data) => {
                setVoteDistribution(data);
            })
        }
    }, [client]);

    return (
        <>
            <Typography variant="h6" sx={{ padding: 2 }}>
                Você é o {playerState.entity.name} do país {playerState.economy.country}.
            </Typography>

            <Typography variant="h6" sx={{ padding: 2 }}>
                Qual decisão você vai tomar?
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', padding: 2 }}>
                {event.options[playerState.entity.id].map((option, index) => {
                    const voteValue = voteDistribution ? (voteDistribution[index] || 0) : 0;
                    console.log(voteDistribution)

                    return (
                        <RoundOption onClick={() => {
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
            <Typography variant="subtitle1" sx={{ padding: 2 }}>
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
                                fontSize: "6rem",
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

function RoundOption({ onClick, description, selected, voteValue = 0 }) {
    return (
        <Box sx={{
            margin: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: "5px"
        }}>
            <Paper onClick={onClick} sx={{
                padding: 2, backgroundColor: selected ? 'lightblue' : 'white', '&:hover': {
                    cursor: "pointer"
                }
            }}>
                <Typography variant="h6">
                    {description}
                </Typography>


            </Paper>

            <LinearProgress variant="determinate" value={voteValue} />

            <Typography variant="subtitle1" sx={{ marginTop: 1 }}>
                {voteValue.toFixed(2)}% de votos
            </Typography>
        </Box>
    );
}