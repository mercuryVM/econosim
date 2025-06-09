const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());
const http = require('http').createServer(app);

const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send({
        status: 'ok',
        message: 'Econosim API is running',
        version: '1.0.0',
    })
});

const {Server} = require('./econosim/Server.js');
var server = new Server(io);

http.listen(process.env.PORT || 3001, () => {
    console.log(`Econosim API is running on http://localhost:${process.env.PORT || 3001}`);
});