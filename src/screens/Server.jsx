import { useServer } from "../hooks/useServer"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableContainer, Paper,
    Grid,
    Button,
    TableHead,
    CircularProgress,
    Divider,
    Dialog,
    DialogContent,
    DialogTitle
} from "@mui/material"
import Twemoji from "react-twemoji"
import { stringToEmoji } from "../utils"
import styles from "./Server.module.css"
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import UpEvent from '../images/upEvent.gif';
import Backface from '../images/backFace.png'
import DownEvent from '../images/badEvent.gif';
import PercentIcon from '@mui/icons-material/Percent';
import Logo from './assets/econosim_logo_1.svg';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { LineChart, Line, XAxis, YAxis, Legend as RechartsLegend, ResponsiveContainer, ReferenceDot } from 'recharts';
import CooktopLogo from './assets/cooktop.png';
import QrCodeIcon from '@mui/icons-material/QrCode';
import QRCode from "react-qr-code"
import TutorialVideo from './assets/tutorial.mp4';

function PreServer({ client, setPreIntro }) {
    useEffect(() => {
        client.playSound("preIntro", 0.1);
        setTimeout(() => {
            setPreIntro(false);
        }, 4 * 1000); // Duração do pre-intro em milissegundos
    }, [client, setPreIntro])

    return (
        <Box sx={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
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
                <img src={CooktopLogo} alt="Cooktop Logo" style={{ width: "480px", marginBottom: "30px" }} />

                <Typography color={"white"} variant="h3" sx={{
                    fontWeight: 600,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
                }}>
                    Grupo Cooktop apresenta
                </Typography>
            </motion.div>
        </Box>
    )
}


function StatusBar() {
    const messages = [
        "Você sabia que o EconoSim é um projeto open-source? Contribua no nosso repositório do GitHub!",
        "Participe e ajude a construir o futuro da economia simulada!",
        "Essa é provavelmente a primeira e única versão do EconoSim, então aproveite!",
        "O Econosim foi desenvolvido em um fim de semana maluco!",
        "Curva IS-LM? Mais como Curva IS-LMAO!",
        "A cada rodada, o jogo se torna mais emocionante!",
        "Você sabia que o EconoSim é inspirado em jogos clássicos de simulação econômica?",
        "A economia é complexa, mas o EconoSim torna tudo mais divertido!",
        "O EconoSim é um jogo de estratégia econômica onde você pode ser o Banco Central ou o Governo!",
        "A economia é como uma montanha-russa, cheia de altos e baixos!",
        "Lembre-se: a inflação é como um balão, se você encher demais, ele estoura!",
        "Quando a economia vai bem, todos dançam! Quando vai mal, todos choram!",
        "clodoaldo é o melhor jogador de EconoSim do mundo!",
    ];
    const [currentIdx, setCurrentIdx] = useState(0);
    const boxRef = useRef(null);

    const handleAnimationEnd = () => {
        setCurrentIdx(prev => (prev + 1) % messages.length);
    };

    return (
        <Box ref={boxRef} sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 1.5,
            background: "linear-gradient(90deg, rgba(34, 139, 34, 0.95) 0%, rgba(46, 125, 50, 0.95) 100%)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
            overflow: "hidden"
        }}>
            <Typography variant="body1" component="div" sx={{
                color: "white",
                fontWeight: 500,
                textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
            }}>
                <Box
                    component="div"
                    key={currentIdx}
                    onAnimationEnd={handleAnimationEnd}
                    sx={{
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        animation: "marquee 15s linear",
                        transform: 'translateX(' + (boxRef.current?.clientWidth || 1024) + 'px)',
                        '@keyframes marquee': {
                            '0%': { transform: 'translateX(' + (boxRef.current?.clientWidth || 1024) + 'px)' },
                            '100%': { transform: 'translateX(-100%)' }
                        }
                    }}
                >
                    {messages[currentIdx]}
                </Box>
            </Typography>
        </Box>
    )
}

function RenderLobby({ client, countdown, handleStartGame }) {
    const [countdownLocal, setCountdownLocal] = useState(countdown);
    const [selectedQr, setSelectedQrCode] = useState(null); useEffect(() => {
        // dispara música de lobby apenas uma vez no mount
        if (client && countdownLocal === null) {
            let intervalId;
            let sound;
            const startLoop = () => {
                sound = client.playSound("lobby", 0.1);
                intervalId = setInterval(() => {
                    if (sound)
                        sound.stop?.();
                    sound = client.playSound("lobby", 0.1);
                }, 64 * 1000);
            };
            startLoop();
            return () => {
                clearInterval(intervalId);
                if (sound)
                    sound.stop?.();
            };
        }
    }, [client, countdownLocal]); // sem dependências: roda só uma vez

    useEffect(() => {
        setCountdownLocal(countdown);
    }, [countdown]);

    const economies = client.state.economies || []
    return (
        <Box
            sx={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                position: "relative"
            }}
        >            {/* Header Fixo com Logo - Compacto */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'linear-gradient(135deg, rgba(34, 139, 34, 0.95) 0%, rgba(46, 125, 50, 0.95) 100%)',
                    backdropFilter: 'blur(15px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <motion.img
                    src={Logo}
                    alt="EconoSim Logo"
                    style={{ height: '40px', maxWidth: '200px', objectFit: 'contain' }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
            </Box>

            <StatusBar />

            <Dialog onClose={() => setSelectedQrCode(null)} open={Boolean(selectedQr)}>                <DialogTitle textAlign={"center"} sx={{
                background: "linear-gradient(135deg, #228B22 0%, #2E7D32 100%)",
                color: "white",
                fontWeight: 600
            }}>
                QR Code para {selectedQr?.role === 0 ? "Banco" : "Governo"} de {economies[selectedQr?.economy]?.country}
            </DialogTitle>
                <DialogContent sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {
                        selectedQr && (
                            <QRCode style={{
                                width: 512,
                                height: 512,
                            }} width={512} height={512} value={
                                window.location.origin + "/?" + new URLSearchParams({
                                    role: selectedQr.role,
                                    economy: selectedQr.economy
                                }).toString()
                            } />
                        )
                    }
                </DialogContent>
            </Dialog >            {/* Conteúdo Principal - Compacto */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 3,
                    mt: 6, // margem para o header fixo compacto
                    px: 2
                }}
            >
                <Typography variant="h4" gutterBottom sx={{
                    fontWeight: 800,
                    mb: 3,
                    color: "#2d3748",
                    textAlign: "center",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
                    fontSize: "28px"
                }}>
                    🏛️ Lobby das Economias 🏛️
                </Typography>
                <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 900 }}>
                    {economies.map((eco, idx) => (
                        <Grid item xs={12} md={6} key={idx} sx={{ display: "flex", justifyContent: "center" }}>
                            <Paper
                                elevation={6}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 4,
                                    minWidth: 320,
                                    maxWidth: 420,
                                    width: "100%",
                                    background: "rgba(255,255,255,0.95)",
                                    backdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255,255,255,0.3)",
                                    boxShadow: "0 12px 30px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.07)",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-3px)",
                                        boxShadow: "0 15px 35px rgba(0,0,0,0.15), 0 6px 15px rgba(0,0,0,0.1)"
                                    }
                                }}
                            >                <Typography variant="h5" gutterBottom align="center" sx={{
                                fontWeight: 700,
                                color: "#228B22",
                                mb: 2,
                                fontSize: "20px"
                            }}>
                                    <span style={{ fontSize: 28, marginRight: 10 }}>{eco.flag}</span>
                                    {eco.country}
                                </Typography>
                                <Grid container spacing={2}>
                                    {
                                        [
                                            {
                                                name: "🏦 Banco Central",
                                                players: eco.banco.players,
                                                color: "#e3f2fd"
                                            },
                                            {
                                                name: "🏛️ Governo",
                                                players: eco.governo.players,
                                                color: "#f3e5f5"
                                            }
                                        ].map((entity, index) => (<Grid item xs={6} key={index} style={{ flex: 1, }}>
                                            <Typography variant="h6" align="center" sx={{
                                                fontWeight: 600,
                                                mb: 1.5,
                                                color: "#2d3748",
                                                fontSize: "14px"
                                            }}>
                                                <Box display={"flex"} alignItems="center" justifyContent="center" gap={0.5}>                                        <QrCodeIcon sx={{
                                                    cursor: "pointer",
                                                    color: "#228B22",
                                                    fontSize: 20,
                                                    "&:hover": {
                                                        opacity: 0.7,
                                                        transform: "scale(1.1)"
                                                    },
                                                    transition: "all 0.2s ease"
                                                }} onClick={() => setSelectedQrCode({
                                                    role: index,
                                                    economy: idx
                                                })} />
                                                    {entity.name}
                                                </Box>
                                            </Typography>
                                            <TableContainer component={Paper} sx={{
                                                borderRadius: 2,
                                                overflow: "hidden",
                                                boxShadow: "0 3px 8px rgba(0,0,0,0.1)"
                                            }}>
                                                <Table size={"small"}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell
                                                                align="center"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    borderBottom: "none",
                                                                    background: entity.color,
                                                                    color: "#2d3748",
                                                                    fontSize: 12,
                                                                    py: 1
                                                                }}
                                                            >
                                                                👥 Jogadores
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>                                                        <TableBody>
                                                        {entity.players.map((player, index) => {
                                                            const emoji = stringToEmoji(player.nickname)

                                                            return (
                                                                <TableRow
                                                                    key={player.id}
                                                                    sx={{
                                                                        backgroundColor: index % 2 === 0 ? "#fafafa" : "#ffffff",
                                                                        "&:hover": {
                                                                            backgroundColor: "#f0f9ff"
                                                                        }
                                                                    }}
                                                                >
                                                                    <TableCell
                                                                        align="center"
                                                                        sx={{
                                                                            fontWeight: 500,
                                                                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "6px",
                                                                            py: 0.8,
                                                                            fontSize: 12
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
                                        ))
                                    }
                                </Grid>                <Box sx={{
                                    mt: 2,
                                    p: 1.5,
                                    background: "linear-gradient(135deg, rgba(34, 139, 34, 0.1) 0%, rgba(46, 125, 50, 0.1) 100%)",
                                    borderRadius: 2,
                                    border: "1px solid rgba(34, 139, 34, 0.2)"
                                }}>
                                    <Typography variant="h6" align="center" sx={{
                                        fontWeight: 600,
                                        color: "#2d3748",
                                        fontSize: "14px"
                                    }}>
                                        🎮 Jogadores Conectados: {eco.banco.players.length + eco.governo.players.length}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                <Typography variant="h6" color="text.secondary" sx={{ mt: 3, mb: 2, fontWeight: 500, fontSize: "16px" }}>
                    ⏳ Aguardando início da partida...
                </Typography>
                {!client.state.started && (<Button
                    variant="contained"
                    size="medium"
                    sx={{
                        mt: 1, px: 4,
                        py: 1.5,
                        borderRadius: 4,
                        fontWeight: 800,
                        fontSize: 16,
                        background: "linear-gradient(135deg, #228B22 0%, #2E7D32 100%)",
                        color: "white",
                        textTransform: "none",
                        boxShadow: "0 6px 24px rgba(34, 139, 34, 0.3)",
                        "&:hover": {
                            background: "linear-gradient(135deg, #1F7A1F 0%, #265828 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 30px rgba(34, 139, 34, 0.4)"
                        },
                        transition: "all 0.3s ease"
                    }}
                    onClick={handleStartGame}
                >
                    🚀 Iniciar Partida
                </Button>
                )}                <Typography sx={{
                    mt: 3,
                    color: "text.secondary",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 500
                }}>
                    Desenvolvido com ❤️ por <strong style={{ color: "#228B22" }}>Cooktop</strong>
                </Typography>
            </Box>
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

        return () => {
            window.removeEventListener("click", handleInteraction);
        }
    }, [firstInteraction])

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
    } return (<Box sx={{
        p: 0,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        color: "#2d3748",
        position: "relative"
    }}>
        {(countdown !== null && countdown !== undefined) && renderCountdown()}
        {!client && (<Box sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
        }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
                🔌 Conectando ao servidor...
            </Typography>
        </Box>
        )}

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
                    <RenderLobby handleStartGame={handleStartGame} client={client} countdown={countdown} />
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

function Tutorial({ setTutorial, tutorial, client }) {
    const ref = useRef(null);

    const endTutorial = () => {
        setTutorial(false);
        // Notify server that tutorial has ended
        if (client && client.sendMessage) {
            client.sendMessage("endTutorial");
        }
    }; useEffect(() => {
        if (ref.current) {
            //on end
            ref.current.onended = () => {
                //endTutorial();
            };
        }
    }, [ref, setTutorial, endTutorial]);

    if (!tutorial) {
        return null;
    }

    return (
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
            }}>
            <video ref={ref} src={TutorialVideo} autoPlay style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: -1,
            }} />

            <Button sx={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 1000,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                color: "black",
                fontWeight: "bold",
                "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 1)",
                }
            }} onClick={endTutorial}>Skip Tutorial</Button>
        </Box>
    )
}

function RenderGame({ client, gameState }) {
    const [state, setState] = useState(0);
    const [localGameState, setLocalGameState] = useState(null);
    const [canUpdate, setCanUpdate] = useState(false);
    const [tutorial, setTutorial] = useState(true);

    useEffect(() => {
        if (state === 0 && localGameState) {
            setTimeout(() => {
                setState(1);
            }, 10 * 1000);
        }
    }, [state, localGameState]);

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

    useEffect(() => {
        if (!tutorial) {
            setCanUpdate(true);
        }
    }, [tutorial]);

    return (
        <>
            {!tutorial && gameState && state === 0 && !gameState.round.roundEnded && <GlobalEventAnnouncement client={client} gameState={gameState} />}
            {!tutorial && localGameState && state === 1 && !gameState.round.roundEnded && <Dashboard client={client} gameState={localGameState} />}            {tutorial && (
                <Tutorial tutorial={tutorial} setTutorial={setTutorial} client={client} />
            )}

            {
                !tutorial && gameState && gameState.round && gameState.round.roundEnded && (<RoundEnd client={client} gameState={gameState} oldGameState={localGameState} />)
            }
        </>
    )
}

function GameSummary({ gameState, client }) {
    const [showWinner, setShowWinner] = useState(false);

    // Calculate final scores and determine winner
    const finalScores = gameState.economies.map(economy => ({
        country: economy.country,
        flag: economy.flag,
        score: Math.floor(economy.score || 0),
        stats: economy.stats
    })).sort((a, b) => b.score - a.score);

    const winner = finalScores[0];

    useEffect(() => {
        if (client && winner) {
            const sound = client.playSound("gameSummary", 0.5);
            return () => {
                sound.stop?.(); // Stop sound when component unmounts
            }
        }
    }, [])

    useEffect(() => {
        // Show winner after a delay
        const timer = setTimeout(() => {
            setShowWinner(true);
            if (client) {
                client.playSound("goodEvent", 0.3);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [client]);

    return (
        <Box sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 1
        }}>
            {/* Header com Logo - Compacto */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'linear-gradient(135deg, rgba(34, 139, 34, 0.95) 0%, rgba(46, 125, 50, 0.95) 100%)',
                    backdropFilter: 'blur(15px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <motion.img
                    src={Logo}
                    alt="EconoSim Logo"
                    style={{ height: '32px', maxWidth: '200px', objectFit: 'contain' }}
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
            </Box>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 15,
                    padding: 20,
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
                    maxWidth: 800,
                    width: "100%",
                    textAlign: "center",
                    marginTop: 45
                }}
            >
                <Typography variant="h4" sx={{
                    fontWeight: 900,
                    background: "linear-gradient(135deg, #228B22 0%, #2E7D32 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    mb: 1.5,
                    fontSize: "1.8rem"
                }}>
                    🏆 FIM DE JOGO! 🏆
                </Typography>

                <Typography variant="h6" sx={{
                    color: "#2d3748",
                    fontWeight: 600,
                    mb: 2.5,
                    fontSize: "1.1rem"
                }}>
                    Resumo Final - 5 Rodadas Completas
                </Typography>

                {/* Ranking Final - Compacto */}
                <Paper sx={{
                    p: 2,
                    mb: 2.5,
                    background: "rgba(255,255,255,0.8)",
                    borderRadius: 3
                }}>
                    <Typography variant="h6" sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: "#2d3748",
                        fontSize: "1.1rem"
                    }}>
                        📊 Ranking Final das Economias
                    </Typography>

                    {finalScores.map((economy, index) => (
                        <motion.div
                            key={economy.country}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.4 }}
                        >
                            <Box sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: 1.2,
                                mb: 1,
                                background: index === 0 ?
                                    "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" :
                                    index === 1 ?
                                        "linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)" :
                                        index === 2 ?
                                            "linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)" :
                                            "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                borderRadius: 2,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 900,
                                        color: index < 3 ? "white" : "#2d3748",
                                        fontSize: "1.2rem"
                                    }}>
                                        {index + 1}º
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        color: index < 3 ? "white" : "#2d3748",
                                        fontWeight: 700,
                                        fontSize: "1rem"
                                    }}>
                                        {economy.flag} {economy.country}
                                    </Typography>
                                </Box>
                                <Typography variant="h6" sx={{
                                    fontWeight: 900,
                                    color: index < 3 ? "white" : "#2d3748",
                                    fontSize: "1.1rem"
                                }}>
                                    {economy.score} pts
                                </Typography>
                            </Box>
                        </motion.div>
                    ))}
                </Paper>

                {/* Winner Announcement - Compacto */}
                {showWinner && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Paper sx={{
                            p: 2.5,
                            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                            borderRadius: 4,
                            border: "2px solid #FFD700",
                            boxShadow: "0 10px 25px rgba(255, 215, 0, 0.3)"
                        }}>
                            <Typography variant="h5" sx={{
                                fontWeight: 900,
                                color: "white",
                                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                                mb: 1,
                                fontSize: "1.4rem"
                            }}>
                                🎉 PARABÉNS! 🎉
                            </Typography>
                            <Typography variant="h6" sx={{
                                fontWeight: 800,
                                color: "white",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                                fontSize: "1.1rem"
                            }}>
                                {winner.flag} {winner.country} é o VENCEDOR!
                            </Typography>
                            <Typography variant="body1" sx={{
                                fontWeight: 600,
                                color: "white",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                                mt: 0.5,
                                fontSize: "0.95rem"
                            }}>
                                Com {winner.score} pontos!
                            </Typography>
                        </Paper>
                    </motion.div>
                )}                {/* Decision Statistics */}
                <Paper sx={{
                    p: 2,
                    mb: 2.5,
                    background: "rgba(255,255,255,0.8)",
                    borderRadius: 3
                }}>
                    <Typography variant="h6" sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: "#2d3748",
                        fontSize: "1.1rem"
                    }}>
                        📊 Histórico de Decisões por Economia
                    </Typography>

                    {finalScores.map((economy, index) => {
                        const decisions = economy.stats.decisions || { good: 0, bad: 0, neutral: 0 };
                        const totalDecisions = decisions.good + decisions.bad + decisions.neutral;

                        return (
                            <motion.div
                                key={`decisions-${economy.country}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                            >
                                <Box sx={{
                                    p: 1.5,
                                    mb: 1.5,
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    borderRadius: 2,
                                    background: "rgba(255,255,255,0.6)"
                                }}>
                                    <Typography variant="body1" sx={{
                                        fontWeight: 700,
                                        color: "#2d3748",
                                        mb: 1,
                                        fontSize: "1rem"
                                    }}>
                                        {economy.flag} {economy.country}
                                    </Typography>

                                    <Box sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: 1,
                                        textAlign: "center"
                                    }}>
                                        <Box sx={{
                                            p: 1,
                                            borderRadius: 1,
                                            background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                                            color: "white"
                                        }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                                                {decisions.good}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                                                ✅ Decisões Boas
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            p: 1,
                                            borderRadius: 1,
                                            background: "linear-gradient(135deg, #FF9800 0%, #f57c00 100%)",
                                            color: "white"
                                        }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                                                {decisions.neutral}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                                                ⚖️ Decisões Neutras
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            p: 1,
                                            borderRadius: 1,
                                            background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                                            color: "white"
                                        }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                                                {decisions.bad}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                                                ❌ Decisões Ruins
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {totalDecisions > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" sx={{
                                                color: "#666",
                                                fontSize: "0.75rem",
                                                fontStyle: "italic"
                                            }}>
                                                Taxa de acerto: {((decisions.good / totalDecisions) * 100).toFixed(1)}%
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </motion.div>
                        );
                    })}
                </Paper>                {/* Global Decision Stats */}
                {(() => {
                    const globalStats = finalScores.reduce((acc, economy) => {
                        const decisions = economy.stats.decisions || { good: 0, bad: 0, neutral: 0 };
                        return {
                            totalGood: acc.totalGood + decisions.good,
                            totalBad: acc.totalBad + decisions.bad,
                            totalNeutral: acc.totalNeutral + decisions.neutral,
                            totalDecisions: acc.totalDecisions + decisions.good + decisions.bad + decisions.neutral
                        };
                    }, { totalGood: 0, totalBad: 0, totalNeutral: 0, totalDecisions: 0 });

                    return (
                        <Paper sx={{
                            p: 2,
                            mb: 2.5,
                            background: "rgba(255,255,255,0.8)",
                            borderRadius: 3
                        }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 700,
                                mb: 2,
                                color: "#2d3748",
                                fontSize: "1.1rem"
                            }}>
                                🌍 Estatísticas Globais de Decisões
                            </Typography>

                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: 1.5,
                                textAlign: "center"
                            }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                                    color: "white"
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.2rem" }}>
                                        {globalStats.totalGood}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                                        ✅ Boas
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    background: "linear-gradient(135deg, #FF9800 0%, #f57c00 100%)",
                                    color: "white"
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.2rem" }}>
                                        {globalStats.totalNeutral}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                                        ⚖️ Neutras
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                                    color: "white"
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.2rem" }}>
                                        {globalStats.totalBad}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                                        ❌ Ruins
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                                    color: "white"
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.2rem" }}>
                                        {globalStats.totalDecisions > 0 ?
                                            ((globalStats.totalGood / globalStats.totalDecisions) * 100).toFixed(0) : 0}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                                        📈 Taxa Global
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    );
                })()}

                {/* Game Stats - Compacto */}
                <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                    <Paper sx={{ p: 1.5, textAlign: "center", borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#228B22", fontSize: "1.3rem" }}>
                            5
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#2d3748", fontSize: "0.8rem" }}>
                            Rodadas Jogadas
                        </Typography>
                    </Paper>

                    <Paper sx={{ p: 1.5, textAlign: "center", borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#228B22", fontSize: "1.3rem" }}>
                            {finalScores.reduce((total, economy) => total + economy.score, 0)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#2d3748", fontSize: "0.8rem" }}>
                            Pontos Totais
                        </Typography>
                    </Paper>
                </Box>

                <Typography sx={{
                    mt: 2,
                    color: "#6c757d",
                    fontSize: 14,
                    fontWeight: 500
                }}>
                    Obrigado por jogar EconoSim! 🎮✨
                </Typography>
            </motion.div>
        </Box>
    );
}

function RoundEnd({ client, gameState, oldGameState }) {
    const [state, setState] = useState(0);
    const [currentEconomy, setCurrentEconomy] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [economyLength, setEconomyLength] = useState(-1);
    const [economies, setEconomies] = useState({
        old: [],
        new: []
    });
    const [numRounds, setNumRounds] = useState(0);

    useEffect(() => {
        if (gameState && gameState.economies && oldGameState && oldGameState.economies) {
            if (JSON.stringify(gameState.economies) !== JSON.stringify(economies.new) || JSON.stringify(oldGameState.economies) !== JSON.stringify(economies.old)) {
                setEconomies({
                    old: oldGameState.economies.map(e => e),
                    new: gameState.economies.map(e => e)
                });
            }
        }
    }, [gameState, oldGameState, economies])

    const selectEconomy = useCallback((index) => {
        return {
            old: economies.old[index],
            new: economies.new[index],
            index: index
        }
    }, [economies]);

    useEffect(() => {
        if (gameState && gameState.economies) {
            if (economyLength !== gameState.economies.length) {
                setEconomyLength(gameState.economies.length);
            }
        }
        if (gameState && gameState.round) {
            if (numRounds !== gameState.round.numRound) {
                setNumRounds(gameState.round.numRound);
            }
        }
    }, [gameState, economyLength, numRounds]);

    useEffect(() => {
        if (state === 0) {
            return;
        }

        if (economyLength > 0 && currentIndex < economyLength) {
            setCurrentEconomy(selectEconomy(currentIndex));
            setState(1);
        } else {
            // Check if we've reached the maximum rounds (5)
            if (numRounds >= 5) {
                setState(3); // Go to game summary state
            } else {
                client.sendMessage("nextRound");
            }
        }
    }, [client, currentIndex, economyLength, selectEconomy, state])

    function goBackEconomy() {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setCurrentEconomy(selectEconomy(currentIndex - 1));
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

    return (
        <>
            {state === 0 && <State0 client={client} />}
            {state === 1 && currentEconomy && <State1 key={currentEconomy?.name} votes={gameState.votes} economy={currentEconomy} gameState={gameState} setState={setState} goBackEconomy={goBackEconomy} />}
            {state === 3 && <GameSummary gameState={gameState} client={client} />}
        </>
    )
}


    function State0({client, }) {
        useEffect(() => {
            if (client) {
                client.playSound("roundEnd", 0.1);
            }
        }, [])

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

    function State1({ economy, votes, gameState, setState, goBackEconomy }) {
        const [localState, setLocalState] = useState(0);
        const [stats, setStats] = useState(economy.old.stats || {});

        const event = economy.old.event || null;
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
                    currentStep++;

                    if (currentStep >= steps) {
                        clearInterval(intervalId);
                        setStats(newStats); // Ensure final state is set
                        return;
                    }

                    const updatedStats = {};
                    keys.forEach((key, index) => {
                        updatedStats[key] = oldStats[key] + deltas[index] * currentStep;
                    });

                    setStats(updatedStats);
                }, interval);

                return () => clearInterval(intervalId); // Cleanup on unmount or state change
            }
        }, [localState, economy]);

        useEffect(() => {
            const onClick = (e) => {
                e.preventDefault();
                const isRightClick = e.button === 2; // Right click

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
                        <>                            <Typography variant="h4" sx={{
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
                            RESULTADOS - Rodada {gameState.round?.numRound}/5
                        </Typography>
                            <Box display={"flex"} flex={1} alignItems={"center"} flexDirection={"column"} gap={2}>
                                <Box display={"grid"} gridTemplateColumns={"0.5fr 4fr 1fr"} sx={{
                                    padding: "16px",
                                    background: "white",
                                    borderRadius: "20px",
                                    width: "50%"
                                }}>
                                    <Dado label={"PIB"} value={"R$ " + (stats.pib).toFixed(2) + " bi"} icon={AccountBalanceIcon} />
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

function RoundEndGraph({ economy }) {
    const {
        pib,
        taxaDeJuros,
        consumoFamiliar,
        investimentoPrivado,
        gastosPublicos,
        ofertaMoeda,
        nivelPrecos,
        demandaMoeda,
        sensibilidadeInvestimentoAoJuros,
        sensibilidadeDaMoedaAosJuros, sensibilidadeDaMoedaARenda
    } = economy.stats;

    // Fórmula IS: Y = C + (I - b*i) + G
    const calcularIS = (i) => {
        const investimentoAjustado = investimentoPrivado - (sensibilidadeInvestimentoAoJuros * i);
        return consumoFamiliar + investimentoAjustado + gastosPublicos;
    };

    // Fórmula LM: Y = (M/P + h*i) / k
    const calcularLM = (i) => {
        const ofertaRealMoeda = ofertaMoeda / nivelPrecos;
        return (ofertaRealMoeda + (sensibilidadeDaMoedaAosJuros * i)) / sensibilidadeDaMoedaARenda;
    };    // Definir range fixo para o gráfico
    const minX = 0;
    const maxX = 0.3;

    // Gerar pontos equidistantes para as curvas (sem incluir taxaDeJuros)
    const xValues = [];
    const isCurve = [];
    const lmCurve = [];

    for (let i = minX; i <= maxX; i += 0.01) {
        const roundedI = parseFloat(i.toFixed(4));
        xValues.push(roundedI);
        isCurve.push(calcularIS(roundedI));
        lmCurve.push(calcularLM(roundedI));
    }

    // Prepare data for Recharts
    const chartData = xValues.map((x, i) => ({
        x: x,
        IS: isCurve[i],
        LM: lmCurve[i],
    }));

    return (
        <>
            <Box style={{ width: "100%", height: "75%", padding: "5px" }} flex={1} display={"flex"} flexDirection={"column"} alignItems={"center"} justifyContent={"center"}>                <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                    <XAxis
                        dataKey="x"
                        domain={[minX, maxX]}
                        type="number"
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
                        name="Curva LM" />
                    {/* Pontos de referência */}

                    {/* Ponto do PIB real (com validação) */}
                    {pib > 0 && (
                        <ReferenceDot
                            x={Number(taxaDeJuros.toFixed(4))}
                            y={Number((pib).toFixed(2))}
                            stroke="#FFD700"
                            fill="#FFD700"
                            r={6}
                            name={"PIB Real"}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
            </Box>
        </>
    )
}

function Dashboard({ client, gameState }) {
    const round = useMemo(() => gameState?.round || {}, [gameState?.round]); useEffect(() => {
        if (round?.roundEnded) {
            client.sendMessage("nextRound");
        }
    }, [client, round]);

    return (
        <Box sx={{
            minHeight: "100vh",
            position: "relative",
            overflow: "hidden"
        }}>            {/* Header Fixo com Logo para Dashboard - Compacto */}

            <Box sx={{
                display: "grid",
                gridTemplateColumns: "1fr 260px 1fr", gap: 1,
                pt: 0, // sem margem para maximizar espaço
                minHeight: "calc(100vh - 40px)"
            }}>
                <Country economy={gameState.economies[0]} />
                <GlobalData client={client} gameState={gameState} />
                <Country economy={gameState.economies[1]} />
            </Box>
        </Box>
    )
}

function GlobalData({ client, gameState }) {

    const round = gameState?.round;
    const globalEvent = round?.globalEvent || null;

    return (
        <Box display={"flex"} flexDirection={"column"} gap={1.5} sx={{ height: "100%" }}>            {/* Round Counter - Compacto */}
            <Paper sx={{
                padding: 1.5,
                fontWeight: 800,
                fontSize: "18px",
                textAlign: "center",
                background: "linear-gradient(135deg, #228B22 0%, #2E7D32 100%)",
                color: "white",
                borderRadius: 3,
                boxShadow: "0 6px 20px rgba(34, 139, 34, 0.3)",
                textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
            }}>
                🎯 Round {round.numRound}/5
            </Paper>

            {/* Global Event Card - Compacto */}
            <Paper sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                overflow: "hidden",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                flex: 1,
                minHeight: 200
            }}>
                <img
                    src={globalEvent ? globalEvent.asset : Backface}
                    alt="Global Event"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        aspectRatio: "644 / 967",
                        borderRadius: 6
                    }}
                />
            </Paper>

            {/* Timer Controls - Compacto */}
            <Paper sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                p: 1.5,
                borderRadius: 3,
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
            }}>
                <RoundTimer client={client} />
            </Paper>
        </Box>
    )
}

const roundTime = 300;

function RoundTimer({ client }) {
    const [timeLeft, setTimeLeft] = useState(roundTime);
    const [timerState, setTimerState] = useState('stopped'); // 'stopped', 'running', 'paused'
    const [timerSpeed, setTimerSpeed] = useState(1); // 1 = normal, 2 = double speed
    const timerRef = useRef(null);

    // Reset timer when new round starts
    useEffect(() => {
        setTimeLeft(roundTime);
        setTimerState('stopped');
        setTimerSpeed(1);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }, [client.state?.round?.numRound]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []); const startTimer = (seconds = roundTime) => {
        if (timerState === 'running') return;

        if (timeLeft === null || timeLeft === 0) {
            setTimeLeft(seconds);
        }

        setTimerState('running');

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setTimerState('stopped');
                    // Emitir evento de fim de rodada
                    client.sendMessage("roundEnd");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000 / timerSpeed);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setTimerState('stopped');
    };

    const pauseTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setTimerState('paused');
    };

    const resetTimer = () => {
        stopTimer();
        setTimeLeft(roundTime);
    };

    const accelerateTimer = () => {
        const newSpeed = timerSpeed === 1 ? 2 : timerSpeed === 2 ? 4 : 1;
        setTimerSpeed(newSpeed);

        if (timerState === 'running') {
            // Restart timer with new speed
            pauseTimer();
            setTimeout(() => {
                setTimerState('running');
                timerRef.current = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            setTimerState('stopped');
                            client.sendMessage("roundEnd");
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000 / newSpeed);
            }, 50);
        }
    };

    const nextRound = () => {
        stopTimer();
        setTimeLeft(roundTime);
        client.sendMessage("nextRound");
    };

    const endRound = () => {
        stopTimer();
        client.sendMessage("roundEnd");
    };

    const progress = timeLeft ? (timeLeft / roundTime) * 100 : 0; function formatTime(seconds) {
        if (seconds === null || seconds === undefined) return "5:00";
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
    } return (
        <>
            {/* Timer Circular - Compacto */}
            <Box flex={1} display="flex" alignItems="center" justifyContent="center" position="relative" sx={{ height: 90 }}>
                <CircularProgress
                    sx={{
                        color: timeLeft <= 60 ? "#ff4757" : "#76c63f",
                        '& .MuiCircularProgress-circle': {
                            strokeWidth: 5,
                            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.2))"
                        }
                    }}
                    variant="determinate"
                    value={progress}
                    size={80}
                />
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
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Typography variant="h6" component="div" sx={{
                            color: timeLeft <= 60 ? "#ff4757" : "#2d3748",
                            fontWeight: 800,
                            textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                            fontSize: "16px"
                        }}>
                            {formatTime(timeLeft)}
                        </Typography>
                    </motion.span>
                </Box>
            </Box>

            {/* Controles do Timer - Compactos */}
            <Box display="flex" flexDirection="column" gap={1} mt={0.5} sx={{ width: "100%" }}>
                <Typography variant="body2" textAlign="center" sx={{
                    color: "#2d3748",
                    fontWeight: 600,
                    background: timerState === 'running' ?
                        "linear-gradient(135deg, rgba(118, 198, 63, 0.2) 0%, rgba(255, 209, 69, 0.2) 100%)" :
                        "rgba(0,0,0,0.05)",
                    borderRadius: 2,
                    py: 0.3,
                    px: 0.8,
                    fontSize: "12px"
                }}>
                    {timerState === 'running' ? '▶ Rodando' : timerState === 'paused' ? '⏸ Pausado' : '⏹ Parado'}
                    {timerSpeed > 1 && ` (${timerSpeed}x)`}
                </Typography>

                {/* Linha 1: Controles básicos */}
                <Box display="flex" gap={0.4} justifyContent="center" flexWrap="wrap">
                    <Button
                        size="small"
                        variant={timerState === 'running' ? "outlined" : "contained"}
                        sx={{
                            minWidth: 32,
                            height: 28,
                            fontSize: 10,
                            background: timerState !== 'running' ?
                                "linear-gradient(135deg, #76c63f 0%, #5da83a 100%)" : "transparent",
                            color: timerState !== 'running' ? "white" : "#76c63f",
                            borderColor: "#76c63f",
                            "&:hover": {
                                background: timerState !== 'running' ?
                                    "linear-gradient(135deg, #6ab02f 0%, #52962f 100%)" : "rgba(118, 198, 63, 0.1)"
                            }
                        }}
                        onClick={() => startTimer()} disabled={timerState === 'running'}
                    >
                        ▶
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{
                            minWidth: 32,
                            height: 28,
                            fontSize: 10,
                            borderColor: "#ffd145",
                            color: "#ffd145",
                            "&:hover": {
                                background: "rgba(255, 209, 69, 0.1)"
                            }
                        }}
                        onClick={pauseTimer}
                        disabled={timerState !== 'running'}
                    >
                        ⏸
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{
                            minWidth: 32,
                            height: 28,
                            fontSize: 10,
                            borderColor: "#ff4757",
                            color: "#ff4757",
                            "&:hover": {
                                background: "rgba(255, 71, 87, 0.1)"
                            }
                        }}
                        onClick={stopTimer}
                        disabled={timerState === 'stopped'}
                    >
                        ⏹
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{
                            minWidth: 32,
                            height: 28,
                            fontSize: 10,
                            borderColor: "#2d3748",
                            color: "#2d3748",
                            "&:hover": {
                                background: "rgba(45, 55, 72, 0.1)"
                            }
                        }}
                        onClick={resetTimer}
                    >
                        ↻
                    </Button>
                </Box>

                {/* Linha 2: Controles avançados - Compactos */}
                <Box display="flex" gap={0.4} justifyContent="center" flexWrap="wrap">
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={accelerateTimer}
                        title={`Velocidade atual: ${timerSpeed}x`}
                        sx={{
                            minWidth: 40,
                            height: 26,
                            fontSize: 9,
                            borderColor: "#9c88ff",
                            color: "#9c88ff",
                            "&:hover": {
                                background: "rgba(156, 136, 255, 0.1)"
                            }
                        }}
                    >
                        ⚡{timerSpeed}x
                    </Button>
                    <Button
                        size="small"
                        variant="contained" onClick={endRound}
                        sx={{
                            minWidth: 45,
                            height: 26,
                            fontSize: 9,
                            background: "linear-gradient(135deg, #ff4757 0%, #e84143 100%)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #e84143 0%, #d63031 100%)"
                            }
                        }}
                    >
                        🏁 Fim
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={nextRound}
                        sx={{
                            minWidth: 45,
                            height: 26,
                            fontSize: 9,
                            background: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #0984e3 0%, #2d3436 100%)"
                            }
                        }}
                    >
                        ➡ Next
                    </Button>
                </Box>
            </Box>
        </>
    )
}

function Country({ economy }) {
    return (
        <Box display={"flex"} flexDirection={"column"} gap={1.5} sx={{ height: "100%" }}>              {/* Header do País - Compacto */}
            <Paper sx={{
                fontSize: "16px",
                textAlign: "center",
                background: "linear-gradient(135deg, #228B22 0%, #2E7D32 100%)",
                color: "white",
                padding: 1.5,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                boxShadow: "0 6px 20px rgba(34, 139, 34, 0.3)",
                textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
            }}>
                <Typography fontSize={20} sx={{ fontWeight: 800 }}>
                    {economy.flag}{" "}
                    {economy.country}
                </Typography>
            </Paper>

            {/* Dados Econômicos - Compactos */}
            <Paper sx={{
                padding: 1.5,
                borderRadius: 3,
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
            }}>
                <Typography variant="h6" sx={{
                    padding: 0.8,
                    fontWeight: 800,
                    textAlign: "center",
                    color: "#2d3748",
                    mb: 0.8,
                    fontSize: "14px"
                }}>
                    📊 Indicadores Econômicos
                </Typography>
                <Box display={"grid"} gridTemplateColumns={"auto 1fr auto"} gap={0.8} sx={{
                    "& > *": {
                        display: "flex",
                        alignItems: "center",
                        py: 0.3
                    }
                }}>
                    <Dado label={"PIB"} value={"R$ " + (economy.stats.pib).toFixed(2) + " bi"} icon={AccountBalanceIcon} />
                    <Dado label={"Taxa de Juros"} value={(economy.stats.taxaDeJuros * 100).toFixed(2) + "%"} icon={PercentIcon} />
                    <Dado label={"Gastos Públicos"} value={"R$ " + (economy.stats.gastosPublicos).toFixed(2) + " bi"} icon={AccountBalanceIcon} />
                    <Dado label={"Investimento Privado"} value={"R$ " + (economy.stats.investimentoPrivado).toFixed(2) + " bi"} icon={PriceCheckIcon} />
                    <Dado label={"Oferta de Moeda"} value={"R$ " + (economy.stats.ofertaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Demanda de Moeda"} value={"R$ " + (economy.stats.demandaMoeda).toFixed(2) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Consumo Familiar"} value={"R$ " + (economy.stats.consumoFamiliar).toFixed(2) + " bi"} icon={FamilyRestroomIcon} />
                </Box>
            </Paper>

            {/* Score e Gráfico - Compactos */}
            <Box sx={{
                display: "grid",
                gridTemplateRows: "auto 1fr",
                flex: 1,
                gap: 1.5
            }}>
                {/* Score */}
                <CountryScore economy={economy} />

                {/* Gráfico IS-LM */}
                <CountryCurves economy={economy} />
            </Box>
        </Box>
    )
}

function CountryScore({ economy }) {
    return (
        <Paper
            sx={{
                padding: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 0.8,
                borderRadius: 3,
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
            }}
        >
            <Typography variant="h6" sx={{
                fontWeight: 800,
                color: "#2d3748",
                textAlign: "center",
                fontSize: "13px"
            }}>
                🏆 Pontuação Econômica
            </Typography>            <Box sx={{
                background: "linear-gradient(135deg, #228B22 0%, #2E7D32 100%)",
                width: "90%",
                borderRadius: 2,
                textAlign: "center",
                padding: 1,
                boxShadow: "0 3px 12px rgba(34, 139, 34, 0.3)"
            }}>
                <Typography variant="h5" sx={{
                    fontWeight: 900,
                    color: "white",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                    fontSize: "20px"
                }}>
                    {Math.floor(economy.score)}
                </Typography>
            </Box>
        </Paper>
    )
}
function CountryCurves({ economy }) {
    const containerRef = useRef(null);

    const {
        pib,
        taxaDeJuros,
        consumoFamiliar,
        investimentoPrivado,
        gastosPublicos,
        ofertaMoeda,
        nivelPrecos,
        demandaMoeda,
        sensibilidadeInvestimentoAoJuros,
        sensibilidadeDaMoedaAosJuros, sensibilidadeDaMoedaARenda
    } = economy.stats;

    // Fórmula IS: Y = C + (I - b*i) + G
    const calcularIS = (i) => {
        const investimentoAjustado = investimentoPrivado - (sensibilidadeInvestimentoAoJuros * i);
        return consumoFamiliar + investimentoAjustado + gastosPublicos;
    };

    // Fórmula LM: Y = (M/P + h*i) / k
    const calcularLM = (i) => {
        const ofertaRealMoeda = ofertaMoeda / nivelPrecos;
        return (ofertaRealMoeda + (sensibilidadeDaMoedaAosJuros * i)) / sensibilidadeDaMoedaARenda;
    };

    const minX = 0;
    const maxX = 0.3;

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

    // Prepare data for Recharts
    const chartData = xValues.map((x, i) => ({
        x: x,
        IS: isCurve[i],
        LM: lmCurve[i],
    }));

    return (<Paper
        ref={containerRef}
        sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 3,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            p: 0.8,
            position: "relative"
        }}
    >
        {/* Título do gráfico - Compacto */}
        <Typography variant="body2" sx={{
            position: "absolute",
            top: 6,
            left: 10,
            fontWeight: 700,
            color: "#2d3748",
            background: "rgba(255,255,255,0.9)",
            padding: "1px 6px",
            borderRadius: 1.5,
            fontSize: 10
        }}>
            📈 Curvas IS-LM
        </Typography>

        <Box style={{ width: "100%", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 12, left: 12, bottom: 20 }}>
                    <XAxis
                        dataKey="x"
                        domain={[minX, maxX]}
                        type="number"
                        tick={{ fontSize: 9, fill: "#2d3748" }}
                        label={{ value: "Taxa de Juros (i)", position: "insideBottom", dy: 12, fontSize: 9, fill: "#2d3748" }}
                        axisLine={{ stroke: "#cbd5e0", strokeWidth: 1 }}
                        tickLine={{ stroke: "#cbd5e0" }}
                    />
                    <YAxis
                        tick={{ fontSize: 9, fill: "#2d3748" }}
                        label={{ value: "Renda (Y)", angle: -90, position: "insideLeft", dx: -3, fontSize: 9, fill: "#2d3748" }}
                        axisLine={{ stroke: "#cbd5e0", strokeWidth: 1 }}
                        tickLine={{ stroke: "#cbd5e0" }}
                    />
                    <RechartsLegend
                        verticalAlign="top"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 9, paddingBottom: 3 }}
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
                        name="Curva LM" />
                    {/* Pontos de referência - Compactos */}
                    {/* Ponto do PIB real (com validação) */}
                    {pib > 0 && (
                        <ReferenceDot
                            x={Number(taxaDeJuros.toFixed(4))}
                            y={Number((pib).toFixed(2))}
                            stroke="#ffd700"
                            fill="#ffd700"
                            r={5}
                            name={"PIB Real"}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </Box>
    </Paper>
    );
}

export function Dado({ label, value, icon: Icon }) {
    return (
        <>
            <Icon sx={{
                color: "#228B22",
                fontSize: 16,
                mr: 0.4
            }} />
            <Typography fontSize={11} sx={{
                color: "#2d3748",
                fontWeight: 600
            }}>
                {label}
            </Typography>
            <Typography fontSize={11} sx={{
                fontWeight: 700,
                color: "#1a202c",
                textAlign: "right"
            }}>
                {value}
            </Typography>
        </>
    )
}

function GlobalEventAnnouncement({ client, gameState }) {
    const [parar, setParar] = useState(false);
    const [globalEvent, setGlobalEvent] = useState(gameState?.round?.globalEvent || null);

    useEffect(() => {
        if (JSON.stringify(gameState?.round?.globalEvent) === JSON.stringify(globalEvent)) return;
        setGlobalEvent(gameState?.round?.globalEvent || null);
    }, [gameState]);

    useEffect(() => {
        if (globalEvent && !parar) {
            const sound = client.playSound("drumRoll", 0.1);
            let timeout = setTimeout(() => {
                setParar(true)
                sound.stop();

                if (globalEvent.goodEvent) {
                    client.playSound("goodEvent", 0.1);
                } else {
                    client.playSound("badEvent", 0.1);
                }
            }, 5500);

            return () => {
                sound.stop();
                clearTimeout(timeout);
            }
        }
    }, [client, globalEvent, parar]);

    if (!globalEvent) return null;

    return (
        <Box sx={{
            minHeight: "100vh",

            position: "relative",
            overflow: "hidden"
        }}>            {/* Header com Logo */}


            {/* Conteúdo do Evento Global */}
            <motion.div
                key={globalEvent.name}
                style={{
                    padding: 16,
                    paddingTop: 100,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                    minHeight: "100vh",
                    justifyContent: "center"
                }}
                className={styles.globalEventContainer}
            >
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5.5, duration: 0.5 }}
                    style={{
                        background: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(20px)",
                        borderRadius: 20,
                        padding: 24,
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                        maxWidth: 800,
                        textAlign: "center"
                    }}
                >                    <Typography variant="h4" sx={{
                    fontWeight: 800,

                    mb: 2
                }}>
                        🌍 Evento Global
                    </Typography>
                    <Typography variant="h5" sx={{
                        color: "#2d3748",
                        fontWeight: 600,
                        lineHeight: 1.4
                    }}>
                        {globalEvent.description}
                    </Typography>
                </motion.div>
            </motion.div>
            <Canvas globalEvent={globalEvent} />
        </Box>
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
        <Box ref={parentRef} sx={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}>
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
    }, [controls, elem, onClose, parent, up]);

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

