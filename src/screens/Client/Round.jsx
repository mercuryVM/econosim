import { Box, LinearProgress, Paper, Typography, CircularProgress } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import banco from '../assets/bancoCentral.png'
import bancoBg from '../assets/bancoBg.png'
import governo from '../assets/governo.png'
import governoBg from '../assets/governoBg.png'
import Logo from '../assets/econosim_logo_1.svg';
import { Dado } from '../Server';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import PercentIcon from '@mui/icons-material/Percent';

function TutorialWaitingScreen() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 20%, #e8f5e8 50%, #d4ff8c 80%,rgb(166, 220, 130) 100%)',
                color: '#333',
                textAlign: 'center',
                padding: { xs: 2, sm: 3 },
                position: 'relative',
                overflow: 'hidden',
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        >
            {/* Background decorative elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(118, 198, 63, 0.2)',
                    filter: 'blur(40px)'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '10%',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(212, 255, 140, 0.3)',
                    filter: 'blur(30px)'
                }}
            />

            {/* Additional green accent elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '40%',
                    left: '5%',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(188, 255, 120, 0.25)',
                    filter: 'blur(25px)'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: '60%',
                    right: '15%',
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'rgba(255, 209, 69, 0.2)',
                    filter: 'blur(35px)'
                }}
            />

            {/* Header com Logo */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ width: '100%', marginTop: '20px' }}
            >
                <motion.img
                    src={Logo}
                    alt="EconoSim Logo"
                    style={{
                        height: '60px',
                        maxWidth: '240px',
                        objectFit: 'contain',
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                />
            </motion.div>

            {/* Conteúdo Central */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    justifyContent: 'center',
                    gap: '24px'
                }}
            >
                {/* Spinner animado */}
                <Box sx={{ position: 'relative' }}>
                    <CircularProgress
                        size={100}
                        thickness={2.5}
                        sx={{
                            color: '#76c63f',
                            filter: 'drop-shadow(0 4px 12px rgba(118, 198, 63, 0.3))'
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '32px'
                        }}
                    >
                        📚
                    </Box>
                </Box>

                {/* Textos principais */}
                <Box sx={{ maxWidth: '280px', px: 1 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 'bold',
                            mb: 1.5,
                            fontSize: '1.75rem',
                            lineHeight: 1.3,
                            color: '#333',
                            textShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        Aguarde o tutorial
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            opacity: 0.8,
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            mb: 2,
                            color: '#555',
                            textShadow: '0 1px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        👀 Olhe para o projetor
                    </Typography>

                    <motion.div
                        animate={{
                            opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: '0.95rem',
                                opacity: 0.7,
                                lineHeight: 1.4,
                                px: 1,
                                color: '#666'
                            }}
                        >
                            O administrador está apresentando as instruções
                        </Typography>
                    </motion.div>
                </Box>
            </motion.div>

            {/* Footer com indicador */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{ marginBottom: '20px' }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        background: 'rgba(118, 198, 63, 0.15)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid rgba(118, 198, 63, 0.3)'
                    }}
                >
                    <Box
                        sx={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#76c63f'
                        }}
                        component={motion.div}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: '0.8rem',
                            opacity: 0.9,
                            fontWeight: 500,
                            color: '#333'
                        }}
                    >
                        Tutorial em andamento
                    </Typography>
                </Box>
            </motion.div>
        </Box>
    );
}

export function Round({ client, gameState, playerState }) {
    // Se o tutorial estiver ativo, mostrar tela de espera
    if (gameState && gameState.tutorial) {
        return <TutorialWaitingScreen />;
    }

    return (
        <>            {/* Header com Logo EconoSim */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 50%, #e8f5e8 100%)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '2px solid #76c63f',
                    padding: { xs: 1, sm: 2 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(118, 198, 63, 0.2)'
                }}
            >
                <motion.img
                    src={Logo}
                    alt="EconoSim Logo"
                    style={{
                        height: '50px',
                        maxWidth: '200px',
                        objectFit: 'contain'
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </Box>

            {/* Conteúdo da Rodada com margem para o header */}
            <Box sx={{ marginTop: { xs: '70px', sm: '80px' } }}>
                <RoundNumber playerState={playerState} />
                <RoundBody client={client} gameState={gameState} playerState={playerState} />
            </Box>
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


    const stats = useMemo(() => {
        if (!gameState) {
            return {};
        }
        return gameState.economies[playerState.myEconomyIndex]?.stats;
    }, [gameState, playerState]);

    if (!roundData || !event) {
        return (
            <Paper>
                <Typography variant="h4" sx={{ padding: 2 }}>
                    Carregando dados da rodada...
                </Typography>
            </Paper>
        );
    } return (
        <Box display={"flex"} flexDirection={"column"} gap={2} sx={{
            minHeight: "calc(100vh - 80px)",
            padding: 2,
            backgroundImage: `url(${playerState.entity.id === "banco" ? bancoBg : governoBg})`,
            backgroundSize: "cover",
            backgroundAttachment: "fixed",
            overflowY: "auto",
        }}>            <Typography variant="h4" sx={{
            backgroundColor: "#76c63f",
            color: "#fff",
            padding: "4px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            display: "inline-block",
            textAlign: "center",
            boxShadow: "0px 2px 4px rgba(118, 198, 63, 0.3)",
            textTransform: "uppercase",
            width: "calc(100% - 32px)",
            pt: "10px",
            marginTop: 2
        }}>
                Rodada {roundData.numRound}/5
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

            <Box display={"grid"} gridTemplateColumns={"0.5fr 3fr 2fr"} sx={{
                    padding: "16px",
                    background: "white",
                    borderRadius: "20px",
                    flex: 1,
                    margin: "0 auto",
                   
                }}>
                    <Dado label={"PIB"} value={"R$ " + (stats.pib).toFixed(2) + " bi"} icon={AccountBalanceIcon} />
                    <Dado label={"Taxa de Juros"} value={(stats.taxaDeJuros * 100).toFixed(2) + "%"} icon={PercentIcon} />
                    <Dado label={"Gastos públicos"} value={"R$ " + (stats.gastosPublicos).toFixed(2) + " bi"} icon={AccountBalanceIcon} />
                    <Dado label={"Investimentos privados"} value={"R$ " + (stats.investimentoPrivado).toFixed(2) + " bi"} icon={PriceCheckIcon} />
                    <Dado label={"Oferta por moeda"} value={"R$ " + (stats.ofertaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Demanda por moeda"} value={"R$ " + (stats.demandaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Consumo familiar"} value={"R$ " + (stats.consumoFamiliar).toFixed(2) + " bi"} icon={FamilyRestroomIcon} />
                </Box>
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
                style={{ width: "100px", height: "100px", marginBottom: "16px", borderRadius: "5px" }}
            />
                <Typography variant="h6">
                    Você é o {playerState.entity.name} do país {playerState.economy.country}.
                </Typography>
            </Box>
            <Typography variant="h6" sx={{ padding: 2, textAlign: "center" }}>
                Qual decisão você vai tomar?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', padding: 2 }}>
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
            <Typography variant="subtitle1" sx={{ padding: 2, textAlign: "center" }}>
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
                            key={roundNumber}                        >
                            Rodada {roundNumber}/5
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

