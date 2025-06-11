import { useServer } from "../hooks/useServer"
import { useEffect, useRef, useState, useMemo } from "react"
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableContainer,
    Paper,
    Grid,
    Button,
    TableHead,
    CircularProgress,
    Divider
} from "@mui/material"
import Twemoji from "react-twemoji"
import { stringToEmoji } from "../utils"
import styles from "./Server.module.css"
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import UpEvent from '../images/upEvent.gif';
import Backface from '../images/backFace.png'
import DownEvent from '../images/badEvent.gif';
import PercentIcon from '@mui/icons-material/Percent';
import Logo from './assets/logo.png';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, ReferenceDot } from 'recharts';
import CooktopLogo from './assets/cooktop.webp';

function PreServer({ client, setPreIntro }) {
    useEffect(() => {
        client.playSound("preIntro", 0.1);
        const timer = setTimeout(() => {
            setPreIntro(false);
        }, 4 * 1000); // Duração do pre-intro em milissegundos
    }, [])

    return (
        <Box sx={{
            background: "rgba(0, 0, 0, 1)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
        }}>
            <motion.div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "white"
            }} initial={{
                opacity: 0,
                y: -50
            }} animate={{
                opacity: 1,
                y: 0
            }} transition={{ duration: 5, ease: "easeInOut" }}
                exit={{
                    opacity: 0,
                    y: -50,
                    transition: { duration: 1, ease: "easeInOut" }
                }}
            >
                <img src={CooktopLogo} alt="Cooktop Logo" style={{ width: "200px", marginBottom: "20px" }} />

                <Typography color={"white"} variant="h4">
                    Grupo Cooktop apresenta
                </Typography>
            </motion.div>
        </Box>

    )
}

export function Server() {
    const { client, gameState } = useServer()
    const [preIntro, setPreIntro] = useState(true)
    const [firstInteraction, setFirstInteraction] = useState(false)
    const [countdown, setCountdown] = useState(null)

    useEffect(() => {
        const handleInteraction = () => {
            if (!firstInteraction) {
                setFirstInteraction(true);
                document.body.style.overflow = "auto"; // Permite rolagem após a interação
            }
        }
        document.body.style.overflow = "hidden"; // Impede rolagem até a interação
        window.addEventListener("click", handleInteraction);
    }, [])

    function handleStartGame() {
        let counter = 5
        client.playSound("roundStart", 0.5)
        setCountdown(counter)

        const interval = setInterval(() => {
            counter -= 1
            setCountdown(counter)

            if (counter === 0) {
                clearInterval(interval)
                setCountdown(undefined)

                // Envia o evento para iniciar a partida
                if (client && client.socket) {
                    client.socket.emit("startGame")
                }
            }
        }, 1000)
    }

    function RenderLobby({client, countdown}) {
        useEffect(() => {
            if (client && countdown === null) {
                let timeout, data;
                function play() {
                    data = client.playSound("lobby", 0.1);

                    timeout = setTimeout(() => {
                        if (data && data.stop) {
                            play();
                        }
                    }, 64 * 1000); // Repetir a cada 64 segundos
                }

                play();
                return () => {
                    clearTimeout(timeout);
                    if (data && data.stop) {
                        data.stop();
                    }
                }
            }
        }, [client, countdown])

        const economies = client.state.economies || []
        return (
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 6,
                    margin: "auto"
                }}
            >
                <img src={Logo} alt="EconoSim Logo" style={{ width: "200px", marginBottom: "20px" }} />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4, color: "black" }}>
                    Lobby das Economias
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                    {economies.map((eco, idx) => (
                        <Grid item xs={12} md={6} key={idx} sx={{ display: "flex", justifyContent: "center" }}>
                            <Paper
                                elevation={6}
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    minWidth: 320,
                                    maxWidth: 400,
                                    width: "100%",
                                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                                    background: "rgba(255,255,255,0.95)",
                                }}
                            >
                                <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 600 }}>
                                    <span style={{ fontSize: 36, marginRight: 10 }}>{eco.flag}</span>
                                    {eco.country}
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} style={{ flex: 1, }}>
                                        <Typography variant="subtitle1" align="center" sx={{ fontWeight: 500 }}>
                                            Banco
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                                            <Table size={"small"}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell
                                                            align="center"
                                                            sx={{
                                                                fontWeight: 600,
                                                                borderBottom: "none",
                                                                backgroundColor: "#e3f2fd",
                                                            }}
                                                        >
                                                            Jogadores
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {eco.banco.players.map((player, index) => {
                                                        const emoji = stringToEmoji(player.nickname)

                                                        return (
                                                            <TableRow
                                                                key={player.id}
                                                                sx={{
                                                                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                                                                }}
                                                            >
                                                                <TableCell
                                                                    align="center"
                                                                    sx={{
                                                                        fontWeight: 500,
                                                                        borderBottom: "none",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "5px"
                                                                    }}
                                                                >
                                                                    <Twemoji options={{ className: styles.emoji }}>{emoji}</Twemoji>
                                                                    {player.nickname}
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                    <Grid item xs={6} style={{ flex: 1, }}>
                                        <Typography variant="subtitle1" align="center" sx={{ fontWeight: 500 }}>
                                            Governo
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden", flex: 1 }}>
                                            <Table sx={{ flex: 1 }} size={"small"}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell
                                                            align="center"
                                                            sx={{
                                                                fontWeight: 600,
                                                                borderBottom: "none",
                                                                backgroundColor: "#e3f2fd",
                                                            }}
                                                        >
                                                            Jogadores
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {eco.governo.players.map((player, index) => {
                                                        const emoji = stringToEmoji(player.nickname)

                                                        return (
                                                            <TableRow
                                                                key={player.id}
                                                                sx={{
                                                                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                                                                }}
                                                            >
                                                                <TableCell
                                                                    align="center"
                                                                    sx={{
                                                                        fontWeight: 500,
                                                                        borderBottom: "none",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "5px"
                                                                    }}
                                                                >
                                                                    <Twemoji options={{ className: styles.emoji }}>{emoji}</Twemoji>
                                                                    {player.nickname}
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle1" align="center" sx={{ mt: 2, fontWeight: 500 }}>
                                    Jogadores Conectados: {eco.banco.players.length + eco.governo.players.length}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 4, mb: 2 }}>
                    Aguardando início da partida...
                </Typography>
                {!client.state.started && (
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{
                            mt: 2,
                            px: 5,
                            py: 1.5,
                            borderRadius: 3,
                            fontWeight: 700,
                            fontSize: 18,
                            boxShadow: "0 4px 20px 0 rgba(33, 150, 243, 0.15)",
                            textTransform: "none",
                        }}
                        onClick={handleStartGame}
                    >
                        Iniciar Partida
                    </Button>
                )}

                <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
                    Desenvolvido com ❤️ por Cooktop
                </Typography>
            </Box>
        )
    }

    function renderCountdown() {
        return (
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
                    key={countdown}
                >
                    {countdown}
                </Typography>
            </Box>
        )
    }

    if (!firstInteraction) {
        return (
            <Box sx={{
                background: "rgba(0, 0, 0, 1)",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}></Box>
        );
    }

    return (
        <Box sx={{ p: 0, minHeight: 0, display: "flex", flexDirection: "column", flex: 1, color: "black" }}>
            {(countdown !== null && countdown !== undefined) && renderCountdown()}
            {!client && (<div>Connecting to server...</div>)}

            <AnimatePresence exitBeforeEnter>
                {preIntro && client && !client.state?.started && (
                    <motion.div
                        key="pre"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <PreServer client={client} setPreIntro={setPreIntro} />
                    </motion.div>
                )}

                {client && !client.state.started && !preIntro && (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <RenderLobby client={client} countdown={countdown} />
                    </motion.div>
                )}

                {client && client.state.started && (
                    <motion.div
                        key="game"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.5 }}
                    >
                        <RenderGame client={client} gameState={gameState} />
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    )
}

function RenderGame({ client, gameState }) {
    const [state, setState] = useState(0);
    const [localGameState, setLocalGameState] = useState(gameState);
    const [canUpdate, setCanUpdate] = useState(true);

    useEffect(() => {
        if (state === 0) {
            setTimeout(() => {
                setState(1);
            }, 10 * 1000);
        }
    }, [state]);

    useEffect(() => {
        if (gameState && canUpdate) {
            setLocalGameState(gameState);
            setCanUpdate(false);
        }
    }, [gameState, canUpdate]);

    useEffect(() => {
        if (gameState && localGameState) {
            if ((
                gameState.round && localGameState.round && gameState.round.numRound !== localGameState.round.numRound
            )
            ||
            (
                gameState.round && !localGameState.round
            )
        ) {
                setState(0);
                setCanUpdate(true);
            }
        }
    }, [gameState, localGameState])

    return (
        <>
            {state === 0 && <GlobalEventAnnouncement client={client} gameState={localGameState} />}
            {state === 1 && <Dashboard client={client} gameState={localGameState} />}

            {
                gameState && gameState.round && gameState.round.roundEnded && (<RoundEnd client={client} gameState={gameState} oldGameState={localGameState} />)
            }
        </>
    )
}

function RoundEnd({ client, gameState, oldGameState }) {
    const [state, setState] = useState(0);
    const [currentEconomy, setCurrentEconomy] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (state === 0) {
            return;
        }

        if (gameState && gameState.economies && gameState.economies.length > 0 && currentIndex < gameState.economies.length) {
            setCurrentEconomy(selectEconomy(currentIndex));
            setState(1);
        } else {
            client.sendMessage("nextRound");
        }
    }, [currentIndex, state])

    function goBackEconomy() {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setCurrentEconomy(selectEconomy(currentIndex - 1));
        }
    }

    function selectEconomy(index) {
        return {
            old: oldGameState.economies[index],
            new: gameState.economies[index],
            index: index
        }
    }

    useEffect(() => {
        if (state >= 2) {
            setCurrentIndex((prev) => prev + 1);
        }
    }, [state])

    useEffect(() => {
        if (state === 0) {
            setTimeout(() => {
                setState(1);
            }, 4 * 1000);
        }
    }, [state])

    function State0() {
        useEffect(() => {
            if (client) {
                client.playSound("roundEnd", 0.1);
            }
        }, [client])

        return (
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
                >
                    FIM DE RODADA
                </Typography>
            </Box>
        )
    }

    function State1({ economy, votes }) {
        const [localState, setLocalState] = useState(0);
        const [stats, setStats] = useState(economy.old.stats || {});

        const event = economy.old.event || null;
        const bancoOptions = event.options.banco || [];
        const governoOptions = event.options.governo || [];
        const selectedBancoOption = votes[economy.index].option.banco;
        const selectedGovernoOption = votes[economy.index].option.governo;
        const outcomeEvent = votes[economy.index].eventResult || null;

        useEffect(() => {

            if (localState === 2) {
                const duration = 2000; // Duration of the transition in milliseconds
                const steps = 60; // Number of steps for the transition
                const interval = duration / steps;

                const oldStats = {
                    ...economy.old.stats,
                    score: economy.old.score || 0,
                } || {};
                const newStats = {
                    ...economy.new.stats,
                    score: economy.new.score || 0,
                } || {};

                const keys = Object.keys(oldStats);
                const deltas = keys.map(key => (newStats[key] - oldStats[key]) / steps);

                let currentStep = 0;
                const intervalId = setInterval(() => {
                    if (currentStep >= steps) {
                        clearInterval(intervalId);
                        setStats(newStats); // Ensure final state is set
                        return;
                    }

                    const updatedStats = { ...stats };
                    keys.forEach((key, index) => {
                        updatedStats[key] = oldStats[key] + deltas[index] * currentStep;
                    });

                    setStats(updatedStats);
                    currentStep++;
                }, interval);

                return () => clearInterval(intervalId); // Cleanup on unmount or state change
            }
        }, [localState, economy]);

        useEffect(() => {
            const onClick = (e) => {
                e.preventDefault();
                const isRightClick = e.button === -1; // Right click
                console.log(e)

                if (!isRightClick) {
                    if (localState === 0) {
                        setLocalState(1);
                    }
                    if (localState === 1) {
                        setLocalState(2);
                    }
                    if (localState === 2) {
                        setState(2);
                    }
                } else {
                    if (localState === 0) {
                        goBackEconomy();
                        setLocalState(2);
                    }
                    if (localState === 1) {
                        setLocalState(0);
                    }
                    if (localState === 2) {
                        setLocalState(1);
                    }
                }
            }

            const handleContextMenu = (e) => {
                e.preventDefault(); // Prevent the context menu from appearing
                onClick(e); // Call the same function to handle right click
            }

            window.addEventListener("click", onClick);
            window.addEventListener("contextmenu", handleContextMenu);

            return () => {
                window.removeEventListener("click", onClick);
                window.removeEventListener("contextmenu", handleContextMenu);
            }
        }, [localState])

        function Decision({ entityName, decision }) {
            return (
                <Paper sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    padding: "1rem 0",
                    flexDirection: "column"
                }}>
                    <Typography fontSize={24} sx={{ fontWeight: 500, fontwcolor: "black", margin: "auto" }}>
                        {entityName} tomou a decisão:
                    </Typography>

                    <Divider sx={{ width: "100%" }} />

                    <Box>
                        <Typography fontSize={16} sx={{ color: "black", margin: "auto" }}>
                            {decision ? decision.description : "Nenhuma opção selecionada"}
                        </Typography>
                    </Box>
                </Paper>
            )
        }

        return (
            <Box sx={{
                position: "absolute",
                top: 0,
                left: 0,
                flex: 1,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                padding: 2,
                gap: 2,
                borderRadius: "20px",
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
            }} className="bg">
                {
                    //NOME DA ECONOMIA
                    localState === 0 && (
                        <>
                            <Typography
                                variant="h6"
                                sx={{
                                    backgroundColor: "#f5a623", // cor de fundo laranja
                                    color: "#fff",              // texto branco
                                    padding: "4px 16px",        // espaço interno
                                    borderRadius: "4px",        // cantos levemente arredondados
                                    fontWeight: "bold",         // negrito
                                    display: "inline-block",    // para ajustar ao conteúdo
                                    textAlign: "center",        // centraliza o texto
                                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)", // leve sombra
                                    textTransform: "uppercase", // tudo em maiúsculas, se desejar
                                }}
                            >
                                {economy.old.country}
                            </Typography>
                        </>
                    )
                }

                {
                    //MOSTRAR SITUAÇÃO LOCAL
                    localState === 1 && (
                        <>

                            <Typography variant="h3" sx={{
                                backgroundColor: "#f5a623", // cor de fundo laranja
                                color: "#fff",              // texto branco
                                padding: "4px 16px",        // espaço interno
                                borderRadius: "4px",        // cantos levemente arredondados
                                fontWeight: "bold",         // negrito
                                display: "inline-block",    // para ajustar ao conteúdo
                                textAlign: "center",        // centraliza o texto
                                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)", // leve sombra
                                textTransform: "uppercase", // tudo em maiúsculas, se desejar
                            }}>
                                {economy.old.country}
                            </Typography>

                            <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "2fr 1fr" }} gap={3} alignItems="center" justifyItems="center">
                                <Box display="flex" flexDirection="column" gap={3}>
                                    <Paper sx={{
                                        display: "flex",

                                        background: "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
                                        boxShadow: "0 4px 16px 0 rgba(31, 38, 135, 0.10)",
                                        borderRadius: "15px",
                                        padding: 4,
                                        flexDirection: "column",
                                        animation: "fadeIn 1s ease-in-out",
                                    }}>
                                        <Typography fontSize={32} sx={{
                                            color: "#263238",
                                            fontWeight: 400,
                                            lineHeight: 0.7,
                                            textShadow: "1px 1px 3px rgba(0, 0, 0, 0.3)",
                                        }}>
                                            Situação Problema:
                                        </Typography>
                                        <Typography fontSize={32} sx={{ fontWeight: 900, color: "#263238", mb: 1 }}>{event.name}</Typography>
                                        <Typography fontSize={20} sx={{
                                            color: "#37474f",
                                            margin: "auto",

                                            textAlign: "center",
                                            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)",
                                        }}>
                                            {event.description}
                                        </Typography>
                                    </Paper>
                                    <Decision entityName={"Banco"} decision={selectedBancoOption} />
                                    <Decision entityName={"Governo"} decision={selectedGovernoOption} />
                                </Box>
                                <img src={event.asset} alt={event.description} style={{
                                    maxHeight: 400,
                                    borderRadius: "30px",

                                    objectFit: "contain",
                                    width: "100%",
                                    maxWidth: 350,
                                    animation: "zoomIn 0.8s ease-in-out",
                                }} />
                            </Box>

                            <Paper sx={{
                                p: 2,
                                mt: "auto",
                                display: "flex",
                                background: "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
                                boxShadow: "0 2px 8px 0 rgba(31, 38, 135, 0.08)",
                                borderRadius: "15px",

                                animation: "fadeIn 1s ease-in-out",
                            }}>
                                <Typography variant="h5" textAlign={"center"} margin={"auto"} sx={{
                                    color: "#263238",
                                    fontWeight: 600,
                                    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)",
                                }}>
                                    {outcomeEvent.resultText}
                                </Typography>
                            </Paper>
                        </>

                    )
                }

                {
                    //MOSTRAR DADOS E GRÁFICO
                    localState === 2 && (
                        <>

                            <Typography variant="h4" sx={{
                                padding: 2,
                                backgroundColor: "#f5a623",
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
                                RESULTADOS
                            </Typography>
                            <Box display={"flex"} flex={1} alignItems={"center"} flexDirection={"column"} gap={2}>
                                <Box display={"grid"} gridTemplateColumns={"0.5fr 4fr 1fr"} sx={{
                                    padding: "16px",
                                    background: "white",
                                    borderRadius: "20px",
                                    width: "50%"
                                }}>
                                    <Dado label={"Taxa de Juros"} value={(stats.taxaDeJuros * 100).toFixed(2) + "%"} icon={PercentIcon} />
                                    <Dado label={"Gastos públicos"} value={"R$ " + (stats.gastosPublicos).toFixed(2) + " bi"} icon={AccountBalanceIcon} />
                                    <Dado label={"Investimentos privados"} value={"R$ " + (stats.investimentoPrivado).toFixed(2) + " bi"} icon={PriceCheckIcon} />
                                    <Dado label={"Oferta por moeda"} value={"R$ " + (stats.ofertaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                                    <Dado label={"Demanda por moeda"} value={"R$ " + (stats.demandaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                                    <Dado label={"Consumo familiar"} value={"R$ " + (stats.consumoFamiliar).toFixed(2) + " bi"} icon={FamilyRestroomIcon} />
                                </Box>

                                <CountryScore economy={{
                                    score: stats.score || 0,
                                }} />

                                <Paper sx={{ padding: 2, flex: 1, width: "50%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px" }}>
                                    <RoundEndGraph economy={{ stats }} />
                                </Paper>
                            </Box>

                        </>
                    )
                }
            </Box>
        )
    }

    return (
        <>


            {state === 0 && <State0 />}
            {state === 1 && currentEconomy && <State1 key={currentEconomy?.name} votes={gameState.votes} economy={currentEconomy} />}

        </>
    )
}

function RoundEndGraph({ economy }) {
    const {
        taxaDeJuros,
        consumoFamiliar,
        investimentoPrivado,
        gastosPublicos,
        ofertaMoeda,
        nivelPrecos,
        demandaMoeda,
        sensibilidadeInvestimentoAoJuros,
        sensibilidadeDaMoedaAosJuros,
        sensibilidadeDaMoedaARenda
    } = economy.stats;

    // Fórmula IS: Y = C + (I - b*i) + G + (X - M)
    const calcularIS = (i) => {
        return consumoFamiliar * (((gastosPublicos + investimentoPrivado) / sensibilidadeInvestimentoAoJuros) - i);
    };

    // Fórmula LM: (M/P) = kY - h*i => Y = (M/P + h*i) / k
    const calcularLM = (i) => {
        return (
            ((sensibilidadeDaMoedaAosJuros / sensibilidadeDaMoedaARenda) * i) - ((1 / sensibilidadeDaMoedaARenda) * (demandaMoeda - (ofertaMoeda / nivelPrecos)))
        )
    };

    // Calcula o ponto de equilíbrio (IS = LM) usando o range definido pelas margens, sem depender de xValues externo
    function calcularEquilibrio() {
        // Resolver algebricamente IS = LM
        const iEquilibrio = (((1 / sensibilidadeDaMoedaARenda) * (demandaMoeda - ofertaMoeda / nivelPrecos) + (consumoFamiliar * (investimentoPrivado + gastosPublicos)) / (sensibilidadeInvestimentoAoJuros))) / (consumoFamiliar + (sensibilidadeDaMoedaAosJuros / sensibilidadeDaMoedaARenda));
        const yEquilibrio = calcularIS(iEquilibrio); // Ou calcularLM(iEquilibrio), já que IS = LM

        return { i: iEquilibrio, y: yEquilibrio };
    }

    // Defina as constantes de margem
    const MARGEM_MIN = 0.03;
    const MARGEM_MAX = 0.03;
    // Calcule minX e maxX antes de gerar xValues
    const minX = 0;
    // Para maxX, precisamos de equilibrio.i, então calculamos antes
    const equilibrioTemp = calcularEquilibrio(minX, Number(taxaDeJuros)); // range amplo só para pegar o equilíbrio
    const maxX = 0.5;
    // Agora gere xValues, isCurve, lmCurve com o range correto
    const xValues = [];
    const isCurve = [];
    const lmCurve = [];
    for (let i = minX; i <= maxX; i += 0.01) {
        const roundedI = parseFloat(i.toFixed(4));
        xValues.push(roundedI);
        isCurve.push(calcularIS(roundedI));
        lmCurve.push(calcularLM(roundedI));
    }
    // Agora calcule o equilibrio final no range correto
    const equilibrio = calcularEquilibrio(minX, maxX);

    // Prepare data for Recharts
    const chartData = xValues.map((x, i) => ({
        x: x,
        IS: isCurve[i],
        LM: lmCurve[i],
    }));

    return (
        <>
            <Box style={{ width: "100%", height: "75%", padding: "5px" }} flex={1} display={"flex"} flexDirection={"column"} alignItems={"center"} justifyContent={"center"}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <XAxis
                            dataKey="x"
                            tick={{ fontSize: 12, fill: "#444" }}
                            label={{ value: "Taxa de Juros (i)", position: "insideBottom", dy: 20, fontSize: 14, fill: "#222" }}
                            axisLine={{ stroke: "#ccc" }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "#444" }}
                            label={{ value: "Renda (Y)", angle: -90, position: "insideLeft", dx: -10, fontSize: 14, fill: "#222" }}
                            axisLine={{ stroke: "#ccc" }}
                            tickLine={false}
                        />
                        <RechartsLegend
                            verticalAlign="top"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="IS"
                            stroke="#1f77b4"
                            strokeWidth={2.5}
                            dot={false}
                            name="Curva IS"
                        />
                        <Line
                            type="monotone"
                            dataKey="LM"
                            stroke="#d62728"
                            strokeWidth={2.5}
                            dot={false}
                            name="Curva LM"
                        />
                        <ReferenceDot
                            x={Number(taxaDeJuros.toFixed(2))}
                            y={calcularIS(taxaDeJuros)}
                            stroke="#1f77b4"
                            fill="#1f77b4"
                            r={5}
                        />
                        <ReferenceDot
                            x={Number(taxaDeJuros.toFixed(2))}
                            y={calcularLM(taxaDeJuros)}
                            stroke="#d62728"
                            fill="#d62728"
                            r={5}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </>
    )
}

function Dashboard({ client, gameState }) {
    const round = gameState?.round || {};

    useEffect(() => {
        if (client)
            client.sendMessage("startTimer");
    }, [client])

    useEffect(() => {
        if (round?.roundEnded) {
            client.sendMessage("nextRound");
        }
    }, [round])

    return (
        <Box gridTemplateColumns={"2fr 1fr 2fr"} display={"grid"} flex={1} gap={2}>
            <Country economy={gameState.economies[0]} />
            <GlobalData client={client} gameState={gameState} />
            <Country economy={gameState.economies[1]} />
        </Box>
    )
}

function GlobalData({ client, gameState }) {

    const round = gameState?.round;
    const globalEvent = round?.globalEvent || null;



    return (
        <Box gridColumn={"span 1"} display={"flex"} flexDirection={"column"} gap={2}>
            <Paper sx={{
                padding: "16px",
                fontWeight: 700,
                fontSize: "24px",
                textAlign: "center",
            }}> Round {round.numRound}</Paper>

            <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={globalEvent ? globalEvent.asset : Backface} alt="Global Event" style={{ width: "100%", height: "100%", objectFit: "contain", aspectRatio: "644 / 967" }} />
            </Paper>

            <Paper sx={{ flex: "28%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                <RoundTimer client={client} />
            </Paper>
        </Box>
    )
}

const roundTime = 300;

function RoundTimer({ client }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (client) {
            const handleTimeUpdate = (time) => {
                setTimeLeft(time);
            }

            client.on("timeUpdate", handleTimeUpdate);

            return () => {
                client.off("timeUpdate", handleTimeUpdate);

            }
        }
    }, [client]);


    const progress = (timeLeft / roundTime) * 100;

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function getTimeKey(timeLeft) {
        if (timeLeft == null) return '';
        if (timeLeft > 60 && timeLeft % 60 === 0) {
            // Minutos cheios acima de 1 min (ex: 3:00, 2:00)
            return `${Math.floor(timeLeft / 60)}:00`;
        }
        if (timeLeft <= 60) {
            // Último minuto: cada segundo é uma key
            return timeLeft;
        }
        // Caso geral: não anima
        return '';
    }

    return (
        <>
            <Box flex={1} display="flex" alignItems="center" justifyContent="center" position="relative" sx={{ height: 150 }}>
                <CircularProgress color={"success"} classes={{
                    circle: styles.circularProgressCircle,
                }} variant="determinate" value={progress} size={120} />
                <Box
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <motion.span key={getTimeKey(timeLeft)}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Typography variant="h4" component="div" color="textSecondary">
                            {formatTime(timeLeft)}
                        </Typography>
                    </motion.span>
                </Box>
            </Box>
        </>
    )
}

function Country({ economy }) {
    return (
        <Box gridColumn={"span 1"} display={"flex"} flexDirection={"column"} gap={2}>
            <Paper sx={{
                padding: "16px",
                fontWeight: 700,
                fontSize: "24px",
                textAlign: "center",
                background: "#f5a623",
                color: "#fff",
                padding: "4px 16px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <Typography fontSize={32} mt={"10px"}>
                    {economy.flag}{" "}
                    {economy.country}
                </Typography>
            </Paper>

            <Paper sx={{ flex: "25%", paddingBottom: 3 }}>
                <Typography variant="h6" sx={{ padding: 1, fontWeight: 700, textAlign: "center" }}>
                    Dados
                </Typography>
                <Box display={"grid"} gridTemplateColumns={"0.5fr 4fr 2fr"} sx={{
                    padding: "0px 16px"
                }}>
                    <Dado label={"Taxa de Juros"} value={(economy.stats.taxaDeJuros * 100).toFixed(2) + "%"} icon={PercentIcon} />
                    <Dado label={"Gastos públicos"} value={"R$ " + (economy.stats.gastosPublicos).toFixed(2) + " bi"} icon={AccountBalanceIcon} />
                    <Dado label={"Investimentos privados"} value={"R$ " + (economy.stats.investimentoPrivado).toFixed(2) + " bi"} icon={PriceCheckIcon} />
                    <Dado label={"Oferta por moeda"} value={"R$ " + (economy.stats.ofertaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Demanda por moeda"} value={"R$ " + (economy.stats.demandaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Consumo familiar"} value={"R$ " + (economy.stats.consumoFamiliar).toFixed(2) + " bi"} icon={FamilyRestroomIcon} />
                </Box>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr", // Divide em duas colunas iguais
                    flex: "1",
                    gap: 2,
                }}
            >

                {/* Coluna da direita: Score e Chart */}
                <Box
                    sx={{
                        gridColumn: "span 1",
                        display: "grid",
                        gridTemplateRows: "1fr 3fr", // Divide em duas linhas iguais
                        gap: 2
                    }}
                >
                    {/* Score */}
                    <CountryScore economy={economy} />

                    {/* Chart */}

                    <CountryCurves economy={economy} />

                </Box>
            </Box>


        </Box>
    )
}

function CountryCard({ economy }) {
    const event = economy?.event || null;

    if (!event) return null;

    return (
        <img src={economy.event.asset} style={{
            width: 0,
            gridColumn: "span 1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: "644 / 967"
        }} />
    )
}

function CountryScore({ economy }) {
    return (
        <Paper
            sx={{
                padding: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 1
            }}
        >
            Score

            <Box sx={{
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                width: "80%",
                borderRadius: 2,
                textAlign: "center",
            }}>
                <Typography variant="h4" sx={{
                    fontWeight: 700,
                    marginTop: "10px",
                    padding: "0 10px",
                    paddingRight: "30px"
                }}>
                    {
                        Math.floor(economy.score)
                    }
                </Typography>
            </Box>
        </Paper>
    )
}
function CountryCurves({ economy }) {
    const [height, setHeight] = useState(0);
    const containerRef = useRef(null);

    const {
        taxaDeJuros,
        consumoFamiliar,
        investimentoPrivado,
        gastosPublicos,
        ofertaMoeda,
        nivelPrecos,
        demandaMoeda,
        sensibilidadeInvestimentoAoJuros,
        sensibilidadeDaMoedaAosJuros,
        sensibilidadeDaMoedaARenda
    } = economy.stats;

    // Fórmula IS: Y = C + (I - b*i) + G + (X - M)
    const calcularIS = (i) => {
        return consumoFamiliar * (((gastosPublicos + investimentoPrivado) / sensibilidadeInvestimentoAoJuros) - i);
    };

    // Fórmula LM: (M/P) = kY - h*i => Y = (M/P + h*i) / k
    const calcularLM = (i) => {
        return (
            ((sensibilidadeDaMoedaAosJuros / sensibilidadeDaMoedaARenda) * i) - ((1 / sensibilidadeDaMoedaARenda) * (demandaMoeda - (ofertaMoeda / nivelPrecos)))
        )
    };

    // Calcula o ponto de equilíbrio (IS = LM) usando o range definido pelas margens, sem depender de xValues externo
    function calcularEquilibrio(minX, maxX) {
        let minDiff = Infinity;
        let iEquilibrio = null;
        let yEquilibrio = null;
        for (let i = minX; i <= maxX; i += 0.005) {
            const roundedI = parseFloat(i.toFixed(4));
            const isY = calcularIS(roundedI);
            const lmY = calcularLM(roundedI);
            const diff = Math.abs(isY - lmY);
            if (diff < minDiff) {
                minDiff = diff;
                iEquilibrio = roundedI;
                yEquilibrio = isY; // ou lmY
            }
        }
        return { i: iEquilibrio, y: yEquilibrio };
    }

    // Defina as constantes de margem
    const MARGEM_MIN = 0.03;
    const MARGEM_MAX = 0.03;
    // Calcule minX e maxX antes de gerar xValues
    const minX = Math.max(0, Number(taxaDeJuros) - MARGEM_MIN);
    // Para maxX, precisamos de equilibrio.i, então calculamos antes
    const equilibrioTemp = calcularEquilibrio(minX, Number(taxaDeJuros) + 0.2); // range amplo só para pegar o equilíbrio
    const maxX = Number(equilibrioTemp.i) + MARGEM_MAX;
    // Agora gere xValues, isCurve, lmCurve com o range correto
    const xValues = [];
    const isCurve = [];
    const lmCurve = [];
    for (let i = minX; i <= maxX; i += 0.005) {
        const roundedI = parseFloat(i.toFixed(4));
        xValues.push(roundedI);
        isCurve.push(calcularIS(roundedI));
        lmCurve.push(calcularLM(roundedI));
    }
    // Agora calcule o equilibrio final no range correto
    const equilibrio = calcularEquilibrio(minX, maxX);

    // Prepare data for Recharts
    const chartData = xValues.map((x, i) => ({
        x: x,
        IS: isCurve[i],
        LM: lmCurve[i],
    }));

    // Capturar altura do container para ajustar o gráfico
    useEffect(() => {
        if (containerRef.current) {
            setHeight(containerRef.current.offsetHeight);
        }
    }, []);



    return (
        <Paper
            ref={containerRef}
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",

            }}
        >
            <Box style={{ width: "100%", height: "75%" }}>
                <ResponsiveContainer >
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <XAxis
                            dataKey="x"
                            tick={{ fontSize: 12, fill: "#444" }}
                            label={{ value: "Taxa de Juros (i)", position: "insideBottom", dy: 20, fontSize: 14, fill: "#222" }}
                            axisLine={{ stroke: "#ccc" }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "#444" }}
                            label={{ value: "Renda (Y)", angle: -90, position: "insideLeft", dx: -10, fontSize: 14, fill: "#222" }}
                            axisLine={{ stroke: "#ccc" }}
                            tickLine={false}
                        />
                        <RechartsLegend
                            verticalAlign="top"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="IS"
                            stroke="#1f77b4"
                            strokeWidth={2.5}
                            dot={false}
                            name="Curva IS"
                        />
                        <Line
                            type="monotone"
                            dataKey="LM"
                            stroke="#d62728"
                            strokeWidth={2.5}
                            dot={false}
                            name="Curva LM"
                        />
                        <ReferenceDot
                            x={Number(taxaDeJuros.toFixed(2))}
                            y={calcularIS(taxaDeJuros)}
                            stroke="#1f77b4"
                            fill="#1f77b4"
                            r={5}
                        />
                        <ReferenceDot
                            x={Number(taxaDeJuros.toFixed(2))}
                            y={calcularLM(taxaDeJuros)}
                            stroke="#d62728"
                            fill="#d62728"
                            r={5}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

function Dado({ label, value, icon: Icon }) {
    return (
        <>
            <Icon />
            <Typography fontSize={14}>
                {label}
            </Typography>
            <Typography fontSize={14} fontWeight={400}>
                {value}
            </Typography>
        </>
    )
}

function GlobalEventAnnouncement({ client, gameState }) {
    const [parar, setParar] = useState(false);
    const [hideGlobalEvent, setHideGlobalEvent] = useState(false);
    const globalEvent = gameState?.round?.globalEvent || null;

    useEffect(() => {
        if (globalEvent && !parar) {
            const sound = client.playSound("drumRoll", 0.1);
            setTimeout(() => {
                setParar(true)
                sound.stop();

                if (globalEvent.goodEvent) {
                    client.playSound("goodEvent", 0.1);
                } else {
                    client.playSound("badEvent", 0.1);
                }
            }, 5500);
        }
    }, [globalEvent, parar]);

    if (!globalEvent) return null;

    return (
        <>
            <motion.div key={globalEvent.name} style={{ p: 2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minHeight: 0 }} className={styles.globalEventContainer}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.globalflipCard}>
                    <motion.div
                        className={styles.globalflipCardInner}
                        initial={{ rotateY: 0, translateY: "100%" }}
                        animate={{ rotateY: 1080 * 1, translateY: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 100, // quanto maior, mais rápido no início
                            damping: 70,    // quanto menor, mais tempo leva pra parar
                        }}
                    >
                        <div className={styles.globalEventCard}>
                            <img src={
                                parar ? globalEvent.asset : Backface
                            } alt={globalEvent.name} className={styles.globalEventImage} />
                        </div>
                        <div className={styles.globalEventCardBack}></div>
                    </motion.div>

                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5.5, duration: 0.5 }}
                >
                    <Typography variant="h5" textAlign="center" marginTop={5} fontWeight={700} sx={{ color: "black" }}>
                        {globalEvent.description}
                    </Typography>
                </motion.div>
            </motion.div>
            <Canvas globalEvent={globalEvent} />
        </>

    );
}

function Canvas({ globalEvent }) {
    const parentRef = useRef(null);
    const [showEvents, setShowEvents] = useState(false);

    const events = useMemo(() => {
        if (!globalEvent) return [];
        return Array.from({ length: 50 }, (_, index) => ({
            id: index,
            up: globalEvent.goodEvent,
        }));
    }, [globalEvent]);

    useEffect(() => {
        if (globalEvent) {
            const timer = setTimeout(() => {
                setShowEvents(true);
            }, 6000); // Delay de 5.5 segundos

            return () => clearTimeout(timer); // Limpa o timer ao desmontar
        }
    }, [globalEvent]);

    return (
        <Box ref={parentRef} sx={{ position: "relative", width: "100%", height: "100%" }}>
            {showEvents &&
                events.map(({ id, up }) => (
                    <EventHumor
                        key={id}
                        up={up}
                        parent={parentRef}
                        onClose={() => {
                            // Adicione lógica para manipular o fechamento, se necessário
                        }}
                    />
                ))}
        </Box>
    );
}

function EventHumor({ up, parent, onClose }) {
    const elem = useRef();
    const controls = useAnimation();

    useEffect(() => {
        if (!parent.current || !elem.current) return;
        // Insira aqui o código para obter a altura e largura do content-video-reactionsBox, se necessário
        const width = parent.current.offsetWidth;
        const height = parent.current.offsetHeight;

        const maxLeft = (width - elem.current.offsetWidth);
        const maxTop = (height - elem.current.offsetHeight);

        const leftPos = Math.floor(Math.random() * (maxLeft + 1));
        const topPos = Math.floor(Math.random() * (maxTop + 1));

        elem.current.style.left = `${leftPos}px`;
        elem.current.style.bottom = `${topPos}px`;

        const newLeft = leftPos// + (-50 + Math.floor(Math.random() * 50));
        const newBottom = topPos - (up ? -1000 : 1000);

        controls.start({
            left: newLeft,
            bottom: newBottom,
            opacity: 0,
            scale: 0,
            transition: { duration: 5, ease: "easeInOut" }
        }).then(() => {
            if (onClose) onClose();
        });
    }, [controls, parent, elem]);

    return (
        <motion.span
            style={{ position: 'absolute', fontSize: 32 }}
            initial={{ opacity: 1 }}
            animate={controls}
            ref={elem}
        >
            {
                up ? (
                    <img src={UpEvent} alt="Evento de subida" style={{ width: 64, height: 64, pointerEvents: "none" }} />
                ) : (
                    <img src={DownEvent} alt="Evento de descida" style={{ width: 64, height: 64, pointerEvents: "none" }} />
                )
            }
        </motion.span>
    );
}

