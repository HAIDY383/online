// index.js
require('dotenv').config();
const { Client, Intents } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require("express");

// Express Server Setup
const app = express();
const port = process.env.PORT || 3500;
app.get('/', (_, res) => res.send('Bot is running'));
app.listen(port, () => console.log(`Express server listening on port ${port}`));

// Discord Bot Setup
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

// Config
const serverId = process.env.server;
const id = process.env.id;

let currentVoiceChannelId = null;

async function connectToVoiceChannel() {
  try {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      console.error("❌ Guild not found");
      return;
    }

    const channel = guild.channels.cache.get(id);
    if (!channel || channel.type !== 'GUILD_VOICE') {
      console.error("❌ Voice channel not valid");
      return;
    }

    if (currentVoiceChannelId === channel.id) return;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    currentVoiceChannelId = channel.id;
    console.log(`✅ Joined voice channel: ${channel.name}`);
  } catch (error) {
    console.error("Error connecting to voice channel:", error);
  }
}

client.on('ready', async () => {
  console.log(`${client.user.username} is online!`);
  await client.user.setPresence({ status: 'online' });
  await connectToVoiceChannel();

  // ตรวจสอบทุกๆ 10 วิ ว่ายังอยู่ในห้องหรือไม่
  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(serverId);
      const me = guild?.members.cache.get(client.user.id);
      const currentChannelId = me?.voice?.channelId;

      if (currentChannelId !== id) {
        console.log("🔁 Bot is not in the target voice channel. Reconnecting...");
        currentVoiceChannelId = null;
        await connectToVoiceChannel();
      }
    } catch (err) {
      console.error("Interval check error:", err);
    }
  }, 10000);
});

client.login(process.env.token);
