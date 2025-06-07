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
} from "@mui/material"
import Twemoji from "react-twemoji"
import { stringToEmoji } from "../utils"
import styles from "./Server.module.css"
import { motion, useAnimation } from "framer-motion";
import UpEvent from '../images/upEvent.gif';
import DownEvent from '../images/badEvent.gif';

export function Server() {
    const { client, gameState } = useServer()
    const [countdown, setCountdown] = useState(null)

    function handleStartGame() {
        let counter = 5
        client.playSound("roundStart", 0.5)
        setCountdown(counter)

        const interval = setInterval(() => {
            counter -= 1
            setCountdown(counter)

            if (counter === 0) {
                clearInterval(interval)
                setCountdown(null)

                // Envia o evento para iniciar a partida
                if (client && client.socket) {
                    client.socket.emit("startGame")
                }
            }
        }, 1000)
    }

    function renderLobby(client) {
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
                }}
            >
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
                                                    {eco.governo.players.map((player, index) => (
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
                                                                }}
                                                            >
                                                                {player.nickname}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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


    return (
        <Box sx={{ p: 0, minHeight: 0, display: "flex", flexDirection: "column", flex: 1, color: "black" }}>
            {countdown !== null && renderCountdown()}
            {!client && (<div>Connecting to server...</div>)}
            {client && !client.state.started ? renderLobby(client) : null}
            {client && client.state.started && (<RenderGame client={client} gameState={gameState} />)}
        </Box>
    )
}

function RenderGame({ client, gameState }) {
    const globalEvent = gameState?.round?.globalEvent || null;

    if (!globalEvent) return null;

    return (
        <>
            <Box key={globalEvent.name} sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minHeight: 0 }} className={styles.globalEventContainer}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.globalflipCard}>
                    <motion.div
                        className={styles.globalflipCardInner}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: 1080 * 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 100, // quanto maior, mais rápido no início
                            damping: 70,    // quanto menor, mais tempo leva pra parar
                        }}
                    >
                        <div className={styles.globalEventCard}>
                            <img src={globalEvent.asset} alt={globalEvent.name} className={styles.globalEventImage} />
                        </div>
                        <div className={styles.globalEventCardBack}></div>
                    </motion.div>

                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                >
                    <Typography variant="h6" textAlign="center">
                        {globalEvent.description}
                    </Typography>
                </motion.div>
            </Box>
            <Canvas globalEvent={globalEvent} />
        </>

    );
}

function Canvas({ globalEvent }) {
    const parentRef = useRef(null);

    const events = useMemo(() => {
        if (!globalEvent) return [];
        return Array.from({ length: 50 }, (_, index) => ({
            id: index,
            up: globalEvent.goodEvent,
        }));
    }, [globalEvent]);

    return (
        <Box ref={parentRef} sx={{ position: "relative", width: "100%", height: "100%" }}>
            {events.map(({ id, up }) => (
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