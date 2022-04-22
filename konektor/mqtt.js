var mqtt = require('mqtt');
// Prodution mqtt
var client = mqtt.connect('mqtt://spairum.my.id', {
    username: 'mqttuntan',
    password: 'mqttuntan',
    clientId: 'wa-client-1' + Math.random()
});
client.on('connect', function () {
    client.subscribe('sendPesan', function (err) {
        if (!err) {
            console.log("subscribe Ping sendPesan")
        }
    })
    client.subscribe('sendGrup', function (err) {
        if (!err) {
            console.log("subscribe sendGrup")
        }
    })
    client.subscribe('sendMedia', function (err) {
        if (!err) {
            console.log("subscribe sendGrup")
        }
    })
});

exports.client = client;