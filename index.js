// index.js

require('dotenv').config();
const { Client, Intents, ChannelType } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require("express");

// Express Server Setup
const app = express();
const port = process.env.PORT || 3500;

app.get('/', (_, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Express server listening on port ${port}`));

// Discord Bot Setup
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

// Config from .env
const serverId = process.env.SERVER_ID;
const voiceChannelId = process.env.VOICE_CHANNEL_ID;
const notifyServerId = process.env.NOTIFY_SERVER_ID;
const notifyTextChannelId = process.env.NOTIFY_TEXT_CHANNEL_ID;

let currentVoiceChannelId = null;

async function sendVoiceChannelNotification(message) {
  try {
    const notifyGuild = client.guilds.cache.get(notifyServerId);
    const notifyChannel = notifyGuild?.channels.cache.get(notifyTextChannelId);
    if (typeof notifyChannel?.send === 'function') {
  await notifyChannel.send(message);
    }
  } catch (err) {
    console.error("Notification error:", err);
  }
}

async function updateBotStatus(channelName) {
  const statusText = channelName ? `อยู่ในห้อง: ${channelName}` : `ไม่ได้อยู่ในห้อง`;
  await client.user.setPresence({
    activities: [{ name: statusText, type: 'PLAYING' }],
    status: 'online',
  });
}

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

    await sendVoiceChannelNotification(`📢 เข้าห้องเสียง **${channel.name}** ในเซิร์เวอร์ **${guild.name}** แล้ว`);
    await updateBotStatus(channel.name);
  } catch (error) {
    console.error("Error connecting to voice channel:", error);
  }
}

client.on('ready', async () => {
  console.log(`${client.user.username} is online!`);
  await connectToVoiceChannel();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.member.id !== client.user.id || newState.guild.id !== serverId) return;

  if (!newState.channelId && oldState.channelId) {
    currentVoiceChannelId = null;
    await sendVoiceChannelNotification(`📤 ออกจากห้องเสียง **${oldState.channel.name}** ในเซิร์เวอร์ **${oldState.guild.name}** แล้ว`);
    await updateBotStatus(null);
    await connectToVoiceChannel();
  } else if (newState.channelId !== oldState.channelId) {
    currentVoiceChannelId = newState.channelId;
    await sendVoiceChannelNotification(`📥 ย้ายไปห้องเสียง **${newState.channel.name}** ในเซิร์เวอร์ **${newState.guild.name}** แล้ว`);
    await updateBotStatus(newState.channel.name);
  }
});

client.login(process.env.token);
