require('dotenv').config();
const { Client, Intents } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require("express");

// ===== Express Server Setup =====
const app = express();
const port = process.env.PORT || 3500;

app.get('/', (_, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Express server listening on port ${port}`));

// ===== Discord Bot Setup =====
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});

// ===== Config from .env =====
const serverId = process.env.server;
const voiceChannelId = process.env.id;

let currentVoiceChannelId = null;

// ===== Functions =====
async function connectToVoiceChannel() {
    try {
        const guild = client.guilds.cache.get(serverId);
        if (!guild) return console.error("Guild not found");

        const channel = guild.channels.cache.get(voiceChannelId);
        if (!channel || channel.type !== 'GUILD_VOICE') return console.error("Voice channel not valid");

        if (currentVoiceChannelId === channel.id) return; // already connected

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        });

        currentVoiceChannelId = channel.id;

        console.log(`📢 เข้าห้องเสียง ${channel.name} ในเซิร์ฟเวอร์ ${guild.name} แล้ว`);
    } catch (error) {
        console.error("Error connecting to voice channel:", error);
    }
}

// ===== Event Handlers =====
client.on('ready', async () => {
    console.log(`${client.user.username} is online!`);
    await client.user.setPresence({ status: 'online' }); // ตั้งค่าสถานะเป็น online โดยไม่มี activity
    await connectToVoiceChannel();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member.id !== client.user.id || newState.guild.id !== serverId) return;

    // ออกจากห้อง
    if (!newState.channelId && oldState.channelId) {
        currentVoiceChannelId = null;
        console.log(`📤 ออกจากห้องเสียง ${oldState.channel.name} ในเซิร์ฟเวอร์ ${oldState.guild.name} แล้ว`);
        await connectToVoiceChannel(); // พยายามเชื่อมต่อใหม่หลังจากออกจากห้อง
    } 
    // ย้ายห้อง
    else if (newState.channelId !== oldState.channelId) {
        currentVoiceChannelId = newState.channelId;
        console.log(`📥 ย้ายไปห้องเสียง ${newState.channel.name} ในเซิร์ฟเวอร์ ${newState.guild.name} แล้ว`);
    }
});

// ===== Login =====
client.login(process.env.token);
