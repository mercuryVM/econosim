import { useClient } from "../hooks/useClient";
import { Lobby } from "./Lobby";
import { Round } from "./Client/Round";
import { useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { TextField, Button, Typography, Container, Card, CardContent } from "@mui/material";
import Logo from './assets/econosim_logo_1.svg';

export function Client() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");
    const economy = searchParams.get("economy");
    
    const [nickname, setNickname] = useState("");
    const [nicknameEntered, setNicknameEntered] = useState(false);

    const { client, playerState, gameState } = useClient(role, economy, nicknameEntered ? nickname : null);    useEffect(() => {        
        return () => {
            if (client) {
                client.disconnect();
            }
        }
    }, [client])

    const handleNicknameSubmit = () => {
        if (nickname.trim().length >= 2 && nickname.trim().length <= 20) {
            setNicknameEntered(true);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleNicknameSubmit();
        }
    };

    // Show nickname input screen if nickname hasn't been entered yet
    if (!nicknameEntered) {
        return (
            <Container 
                maxWidth="sm" 
                sx={{ 
                    minHeight: '100vh', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: { xs: 2, sm: 3 }
                }}
            >
                <Card 
                    elevation={4}
                    sx={{ 
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: 3
                    }}
                >
                    <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
                        <img 
                            src={Logo} 
                            alt="Econosim Logo" 
                            style={{ 
                                width: '100%', 
                                height: 'auto', 
                                marginBottom: 20 
                            }}
                            />
                        
                        <Typography 
                            variant="body1" 
                            align="center" 
                            color="text.secondary"
                            sx={{ marginBottom: 3 }}
                        >
                            Insira seu nickname para entrar no jogo
                        </Typography>

                        <TextField
                            fullWidth
                            label="Nickname"
                            variant="outlined"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Digite seu nickname..."
                            error={nickname.length > 0 && (nickname.trim().length < 2 || nickname.trim().length > 20)}
                            helperText={
                                nickname.length > 0 && (nickname.trim().length < 2 || nickname.trim().length > 20)
                                    ? "O nickname deve ter entre 2 e 20 caracteres"
                                    : "Entre 2 e 20 caracteres"
                            }
                            sx={{ 
                                marginBottom: 3,
                                '& .MuiOutlinedInput-root': {
                                    fontSize: { xs: '1rem', sm: '1.1rem' },
                                    padding: { xs: '0', sm: '0' }
                                }
                            }}
                            inputProps={{
                                maxLength: 20,
                                style: {
                                    fontSize: window.innerWidth < 600 ? '16px' : '1.1rem' // Prevents zoom on iOS
                                }
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleNicknameSubmit}
                            disabled={nickname.trim().length < 2 || nickname.trim().length > 20}
                            sx={{ 
                                padding: { xs: '12px', sm: '16px' },
                                fontSize: { xs: '1rem', sm: '1.1rem' },
                                fontWeight: 'bold',
                                borderRadius: 2
                            }}
                        >
                            Entrar no Jogo
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        );
    }

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