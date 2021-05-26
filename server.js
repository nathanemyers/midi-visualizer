const express = require('express');
const cors = require('cors')
const midi = require('midi')
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors())
app.use('/videos', express.static('videos'))

app.get('/color-display', (req, res) => {
    res.sendFile(__dirname + '/colors.html');
});

app.get('/video-display', (req, res) => {
    res.sendFile(__dirname + '/videos.html');
});

app.get('/video-list', (req, res) => {
    const videoRegex = new RegExp('.*\.mp4$');
    const files = []
    fs.readdirSync('./videos/').forEach(file => {
        if(videoRegex.test(file)) {
            files.push(file)
        }
    });
    res.json({
        videos: files
    })
});

io.on('connection', (socket) => {
    console.log('webpage connected');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

// MIDI CONTROLLER
try {
    const input = new midi.Input();

    input.getPortCount();
    input.getPortName(0);

    input.on('message', (deltaTime, message) => {
        // The message is an array of numbers corresponding to the MIDI bytes:
        //   [status, data1, data2]
        // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
        // information interpreting the messages.
        console.log(`m: ${message} d: ${deltaTime}`);
        const [first, key, third] = message
        io.emit('note', {
            keydown: first === 144,
            key,
        })
    });

    // Open the first available input port.
    input.openPort(0);

    // Sysex, timing, and active sensing messages are ignored
    // by default. To enable these message types, pass false for
    // the appropriate type in the function below.
    // Order: (Sysex, Timing, Active Sensing)
    // For example if you want to receive only MIDI Clock beats
    // you should use
    // input.ignoreTypes(true, false, true)
    input.ignoreTypes(false, false, false);

    // ... receive MIDI messages ...

    // Close the port when done.
    // const timeoutSeconds = 120
    // setTimeout(function() {
    //   console.log(`closing midi bridge, no activity for ${timeoutSeconds} seconds`)
    //   input.closePort();
    // }, timeoutSeconds * 1000);
} catch (e) {
    console.log(`Unable to find midi input, skipping midi controls`)
    console.log(`To enable midi, plug in a midi source and restart server`)
    console.log(` --- `)
}