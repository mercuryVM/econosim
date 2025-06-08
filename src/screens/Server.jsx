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
import Backface from '../images/backFace.png'
import DownEvent from '../images/badEvent.gif';
import PercentIcon from '@mui/icons-material/Percent';

import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { LineChart } from '@mui/x-charts/LineChart';
import { Scatter, ScatterChart } from "@mui/x-charts"

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
    const [state, setState] = useState(0);

    useEffect(() => {
        if (state === 0) {
            setTimeout(() => {
                setState(1);
            }, 10 * 1000);
        }
    }, [state]);

    return (
        <>
            {state === 0 && <GlobalEventAnnouncement client={client} gameState={gameState} />}
            {state === 1 && <Dashboard client={client} gameState={gameState} />}
        </>
    )
}

function Dashboard({ client, gameState }) {
    const round = gameState?.round || {};

    return (
        <Box gridTemplateColumns={"1fr 1fr 1fr"} display={"grid"} flex={1} gap={2}>
            <Country economy={gameState.economies[0]} />
            <GlobalData gameState={gameState} />
            <Country economy={gameState.economies[1]} />
        </Box>
    )
}

function GlobalData({ gameState }) {
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

            <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "75%" }}>

            </Paper>

            <Paper sx={{ flex: "28%" }}>

            </Paper>
        </Box>
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
            }}>
                {economy.flag}{" "}
                {economy.country}
            </Paper>

            <Paper sx={{ flex: "25%", paddingBottom: 3 }}>
                <Typography variant="h6" sx={{ padding: 1, fontWeight: 700, textAlign: "center" }}>
                    Dados
                </Typography>
                <Box display={"grid"} gridTemplateColumns={"0.5fr 4fr 1fr"} sx={{
                    padding: "0px 16px"
                }}>
                    <Dado label={"Taxa de Juros"} value={(economy.stats.taxaDeJuros * 100).toFixed(1) + "%"} icon={PercentIcon} />
                    <Dado label={"Gastos públicos"} value={"R$ " + (economy.stats.gastosPublicos * 10) + " bi"} icon={AccountBalanceIcon} />
                    <Dado label={"Investimentos privados"} value={"R$ " + (economy.stats.investimentoPrivado * 10) + " bi"} icon={PriceCheckIcon} />
                    <Dado label={"Oferta por moeda"} value={"R$ " + (economy.stats.ofertaMoeda * 10) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Demanda por moeda"} value={"R$ " + (economy.stats.demandaMoeda * 10) + " bi"} icon={MonetizationOnIcon} />
                    <Dado label={"Consumo familiar"} value={"R$ " + (economy.stats.consumoFamiliar * 10) + " bi"} icon={FamilyRestroomIcon} />
                </Box>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr", // Divide em duas colunas iguais
                    flex: "35%",
                    gap: 2,
                }}
            >
                {/* Coluna da esquerda: Event */}
                <CountryCard economy={economy} />

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
                }}>
                    {economy.score}
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

    function calcularY({ A, b, a, h, L, M, P, k }) {
        const parte1 = (L - M / P) / h;
        const parte2 = A / b;
        const numerador = parte1 - parte2;

        const denominador = -(1 / a) - (k / h);

        const Y = numerador / denominador;
        return Y;
    }

    // Gerar dados para o gráfico
    const xValues = [];
    const isCurve = [];
    const lmCurve = [];

    for (let i = 0.0; i <= 0.2; i += 0.005) {
        const roundedI = parseFloat(i.toFixed(3));
        xValues.push(roundedI);
        isCurve.push(calcularIS(roundedI));
        lmCurve.push(calcularLM(roundedI));
    }

    let equilibrio = null;

    console.log("Equilíbrio encontrado:", equilibrio);

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
            <LineChart
                xAxis={[
                    {
                        data: xValues,
                        label: "Taxa de Juros (i)",
                        position: 'none',
                    }
                ]}
                yAxis={[
                    {
                        label: "Produto (Y)",
                        position: 'none',
                    }
                ]}
                series={[
                    {
                        data: isCurve, label: "Curva IS", color: 'blue', showMark: ({ index }) => {
                            return Number(lmCurve[index]).toFixed(2) === Number(isCurve[index]).toFixed(2) || isCurve[index] === calcularIS(taxaDeJuros)
                        },
                    },
                    {
                        data: lmCurve, label: "Curva LM", color: 'green', showMark: ({ index }) => {
                            return Number(lmCurve[index]).toFixed(2) === Number(isCurve[index]).toFixed(2) || lmCurve[index] === calcularLM(taxaDeJuros);
                        },
                    },
     
                ]}
                height={height * 1}
                grid={{ vertical: false, horizontal: true }}

                legend={{ position: 'top' }}
            >
            </LineChart>

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