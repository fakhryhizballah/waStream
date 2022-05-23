var mqtt = require('mqtt');
require('dotenv').config();

let client = mqtt.connect(process.env.mqtt_host, {
    username: process.env.mqtt_username,
    password: process.env.mqtt_password,
    clientId: process.env.mqtt_client_id + Math.random(),
    connectTimeout: 1000,
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