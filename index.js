const { Client, Intents } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require("express");

const app = express();
const port = process.env.PORT || 3500;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const serverId = '970470272530542642';
const voiceChannelId = '1265711225690390538';

async function connectToVoiceChannel() {
  try {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      console.error('Guild not found.');
      return;
    }

    const channel = guild.channels.cache.get(voiceChannelId);
    if (channel && channel.isVoice()) {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });
      console.log(`Bot has joined the voice channel: ${channel.name} in server: ${guild.name}`);
    } else {
      console.error("The specified channel ID is not a voice channel.");
    }
  } catch (error) {
    console.error("Error connecting to voice channel:", error);
  }
}

client.on('ready', async () => {
  console.log(`${client.user.username} is online!`);
  
  // Connect the bot to the specified voice channel upon login
  await connectToVoiceChannel();
});

// Detect events when the bot's voice state changes
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.member.id === client.user.id) {
    if (newState.guild.id !== serverId) return; // Check if the server matches the specified one

    if (!newState.channelId && oldState.channelId) {
      console.log(`Bot was disconnected from voice channel: ${oldState.channel.name} in server: ${oldState.channel.guild.name}`);
      await connectToVoiceChannel();
    } else if (newState.channelId) {
      const newChannel = newState.channel;
      console.log(`Bot was moved to voice channel: ${newChannel.name} in server: ${newChannel.guild.name}`);
    }
  }
});

client.login('NTE2MjE1Nzc5MDcxNjIzMTcw.Gex6Rm.UiSHO7n1GcLSO1A1PlAYV7UReqdluOPX1PJezc'); // Remember to replace 'your-token-here' with your actual bot token
