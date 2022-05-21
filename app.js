const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { phoneNumberFormatter } = require('./helpers/formatter');
// const { checkRegisteredNumber } = require('./helpers/profilecek');
const qrcode = require("qrcode-terminal");
const mqtt = require('./konektor/mqtt');
const fs = require('fs');
const mime = require('mime-types');
const Sentry = require("@sentry/node");

Sentry.init({
    dsn: "https://a11c2db9538142629a13b6639c855d13@o1253817.ingest.sentry.io/6424120",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

console.log("Connection to Whatsapp Web Client");


const client = new Client({
    authStrategy: new LocalAuth({
        // clientId: "client-one"
        restartOnAuthFail: true,
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
        }
    })
});

client.initialize();

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true }, function (qrcode) {
        console.log(qrcode)
    });
});

client.on('authenticated', async (session) => {
    console.log('WHATSAPP WEB => Authenticated');
    Sentry.captureEvent("Authenticated")
});

client.on("ready", async () => {
    Sentry.captureEvent("ready")
    console.log("WHATSAPP WEB => Ready");
    mqtt.client.on('message', async function (topic, message) {
        if (topic == 'sendPesan') {
            let data = JSON.parse(message);
            console.log(data.number);
            let noHp = phoneNumberFormatter(data.number);
            let pesan = data.message;
            console.log(noHp);
            console.log(pesan);

            const isRegistered = await checkRegisteredNumber(data.number);
            console.log(isRegistered);
            if (isRegistered) {
                client.sendMessage(noHp, data.message).then(response => {
                    console.log(response);
                    console.log("Pesan Terkirim");
                }).catch(err => {
                    console.log(err);
                    Sentry.captureException(err);
                });
            } else {
                console.log('WHATSAPP WEB => User not registered');
            }
        } else if (topic == 'sendGrup') {
            try {
                let data = JSON.parse(message);
                console.log('nama Grub: ' + (data.grup));
                console.log('pesan Grub: ' + data.message);

                const group = await findGroupByName(data.grup);
                if (group) {
                    chatId = group.id._serialized;
                    console.log(group.id._serialized);
                    client.sendMessage(group.id._serialized, data.message).then(response => {
                        // console.log(response);
                        console.log("Pesan Grup Terkirim");
                    }).catch(err => {
                        console.log(err);
                    });
                }
                console.log('No group found with name: ' + data.grup);
            } catch (error) {
                Sentry.captureException(err);
                console.log(error)
            }
        }
    });
});

client.on('disconnected', (reason) => {
    console.log('Session file deleted!');
    client.destroy();
    client.initialize();
});
client.on('message', async (msg) => {
    console.log("------------------------------------------------------");
    // Downloading media
    const getContact = await client.getContactById(msg.from).then(contacts => {
        // console.log(contacts.pushname);
        return contacts;
    }).catch(err => {
        Sentry.captureException(err);
        console.log(err);
    });
    if (msg.hasMedia) {
        msg.downloadMedia().then(media => {
            if (media) {
                // The folder to store: change as you want!
                // Create if not exists
                const mediaPath = './downloaded-media/' + getContact.name + '/';
                if (!fs.existsSync(mediaPath)) {
                    fs.mkdirSync(mediaPath);
                }
                // Get the file extension by mime-type
                const extension = mime.extension(media.mimetype);
                // Filename: change as you want! 
                // I will use the time for this example
                // Why not use media.filename? Because the value is not certain exists
                const timeStamp = new Date().getTime();
                const fullFilename = mediaPath + getContact.pushname + timeStamp + '.' + extension;
                // Save to file
                try {
                    fs.writeFileSync(fullFilename, media.data, { encoding: 'base64' });
                    console.log('File downloaded successfully!', fullFilename);
                } catch (err) {
                    console.log('Failed to save the file:', err);
                }
            }
        }).catch(err => {
            Sentry.captureException(err);
            console.log(err);
        });
    }

})
module.exports = client;
const findGroupByName = async function (name) {
    const group = await client.getChats().then(chats => {
        return chats.find(chat =>
            chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
        );
    });
    return group;
}

const checkRegisteredNumber = async function (number) {
    const isRegistered = await client.isRegisteredUser(number);
    return isRegistered;
}