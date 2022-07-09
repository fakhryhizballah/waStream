const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { phoneNumberFormatter } = require('./helpers/formatter');
// const { checkRegisteredNumber } = require('./helpers/profilecek');
const qrcode = require("qrcode-terminal");
const { clientMq } = require('./konektor/mqtt');
const { logs, status } = require('./model/logModel');
const fs = require('fs');
const mime = require('mime-types');
console.log("Connection to Whatsapp Web Client");


const client = new Client({
    // authStrategy: new NoAuth({
    authStrategy: new LocalAuth({
        // clientId: "client-two",
        // dataPath: "./data",
        restartOnAuthFail: false,
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
                '--disable-gpu',
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
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on("ready", async () => {
    console.log("WHATSAPP WEB => Ready");
});

client.on('disconnected', (reason) => {
    console.log('Session file deleted!');
    console.log('Client was logged out', reason);
    // client.initialize();
    client.resetState();
});
client.on('change_state', state => {
    console.log('CHANGE STATE', state);
});


client.on('message', async (msg) => {
    console.log("------------------------------------------------------");
    console.log("Msg: " + msg.body);
    // console.log(msg.author);
    console.log("from: " + msg.from);
    // Downloading media
    await client.sendSeen(msg.from);
    const getChats = await client.getChatById(msg.from).then(data => {
        // console.log(data);
        console.log("getChats: " + data.name);
        // console.log("grub satus: " + data.isGroup);
        return data;
    }).catch(err => {
        console.log(err);
    });

    if (getChats.isGroup == true) {
        console.log("Grub");
        var getContact = await client.getContactById(msg.author).then(contacts => {
            // console.log(contacts);
            console.log("name: " + contacts.pushname);
            return contacts.pushname;
        }).catch(err => {
            // console.log(err);
        });
    } else {
        console.log("Private");
        var getContact = await client.getContactById(msg.from).then(contacts => {
            // console.log(contacts);
            console.log("name: " + contacts.pushname);
            return contacts.pushname;
        }).catch(err => {
            // console.log(err);
        });
    }

    if (msg.hasMedia) {
        msg.downloadMedia().then(media => {
            if (media) {
                // The folder to store: change as you want!
                // Create if not exists
                const mediaPath = './downloaded-media/' + getChats.name + '/';
                if (!fs.existsSync(mediaPath)) {
                    fs.mkdirSync(mediaPath);
                }
                // Get the file extension by mime-type
                const extension = mime.extension(media.mimetype);
                // Filename: change as you want! 
                // I will use the time for this example
                // Why not use media.filename? Because the value is not certain exists
                const timeStamp = new Date().getTime();
                const fullFilename = mediaPath + getContact + timeStamp + '.' + extension;
                // Save to file
                try {
                    fs.writeFileSync(fullFilename, media.data, { encoding: 'base64' });
                    console.log('File downloaded successfully!', fullFilename);
                } catch (err) {
                    console.log('Failed to save the file:', err);
                }
            }
        }).catch(err => {
            console.log(err);
        });
    }
    // const mentions = await msg.getMentions();
    // for (let contact of mentions) {
    //     console.log(`${contact.pushname} was mentioned`);
    //     console.log(msg.body + '\n');
    //     var pesan = msg.body.slice(14);
    //     console.log(mentions);
    //     msg.reply('Sebentar ya ' + contact.pushname);
    // }
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
clientMq.on('message', async function (topic, message) {
    if (topic == 'sendPesan') {
        let data = JSON.parse(message);
        console.log(data.number);
        let noHp = phoneNumberFormatter(data.number);
        let pesan = data.message;
        console.log(noHp);
        console.log(pesan);
        try {
            const isRegistered = await checkRegisteredNumber(noHp);
            console.log(isRegistered);
            if (isRegistered) {
                client.sendMessage(noHp, data.message).then(response => {
                    console.log(response);
                    console.log("Pesan Terkirim");
                    status(data.number, 'valid-send');
                    logs(data.number, data.message, 'terkirim');
                }).catch(err => {
                    status(data.number, 'valid');
                    console.log(err);
                });
            } else {
                status(data.number, 'invalid');
                logs(data.number, data.message, 'user-not-registered');
                console.log('WHATSAPP WEB => User not registered');
            }
        }
        catch (err) {
            console.log(err);
            logs(data.number, data.message, 'wa-error');
            status(data.number, 'wa-error');
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
            console.log(error)
            logs(data.grup, data.message, 'wa-error');
        }
    }
});