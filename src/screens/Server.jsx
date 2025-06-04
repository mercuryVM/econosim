import { useServer } from "../hooks/useServer"
import { useState } from "react"
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
} from "@mui/material"

export function Server() {
    const { client } = useServer()
    const [countdown, setCountdown] = useState(null)

    function handleStartGame() {
        let counter = 5
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
                    background: "linear-gradient(135deg, #e3f2fd 0%, #fffde7 100%)",
                    py: 6,
                }}
            >
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
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
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle1" align="center" sx={{ fontWeight: 500 }}>
                                            Banco
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                                            <Table size="small">
                                                <TableBody>
                                                    {eco.bank.players.map((player, index) => (
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
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle1" align="center" sx={{ fontWeight: 500 }}>
                                            Governo
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                                            <Table size="small">
                                                <TableBody>
                                                    {eco.government.players.map((player, index) => (
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
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                }}
            >
                <Typography variant="h1" sx={{ color: "white", fontWeight: 700 }}>
                    {countdown}
                </Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 0, minHeight: 0, display: "flex", flexDirection: "column", flex: 1 }}>
            {countdown !== null && renderCountdown()}
            {client ? renderLobby(client) : <div>Connecting to server...</div>}
        </Box>
    )
}