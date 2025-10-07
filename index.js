require('dotenv').config();
const express = require('express');
const { Client } = require('discord.js-selfbot-v13');

const app = express();
const PORT = process.env.PORT || 10000;

const client = new Client({
    checkUpdate: false
});

client.once('ready', async () => {
    console.log(`${client.user.username} is online!`);

    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        if (channel && channel.join) {
            await channel.join();
            console.log(`✅ Joined voice channel: ${channel.name}`);
        } else {
            console.log(`⚠️ Cannot join channel: ${channel?.name || 'Not Found'}`);
        }
    } catch (err) {
        console.error('Error joining voice channel:', err);
    }
});

client.login(process.env.TOKEN).catch(err => {
    console.error('Login failed:', err);
});

// Express server
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});
