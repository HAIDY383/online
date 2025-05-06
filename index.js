// index.js

const { Client, Intents } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require("express");

// Express Server Setup
const app = express();
const port = process.env.PORT || 3500;

app.get('/', (_, res) => res.send('Hello World!'));
app.listen(port);

// Discord Bot Setup
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

// Config Constants
const serverId = '970470272530542642';
const voiceChannelId = '1166411014691115259';
const notifyServerId = '1273594630276911127';
const notifyTextChannelId = '1367228382512943114';

// Utility: Send message to text channel
async function sendVoiceChannelNotification(message) {
  const notifyGuild = client.guilds.cache.get(notifyServerId);
  const notifyChannel = notifyGuild?.channels.cache.get(notifyTextChannelId);
  if (notifyChannel?.isText()) {
    notifyChannel.send(message).catch(console.error);
  }
}

// Utility: Update bot's status
async function updateBotStatus(channelName) {
  const statusText = channelName ? `อยู่ในห้อง: ${channelName}` : `ไม่ได้อยู่ในห้อง`;
  await client.user.setPresence({
    activities: [{ name: statusText, type: 'PLAYING' }],
    status: 'online',
  });
}

// Connect to voice channel
async function connectToVoiceChannel() {
  try {
    const guild = client.guilds.cache.get(serverId);
    const channel = guild?.channels.cache.get(voiceChannelId);

    if (channel?.isVoice()) {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      await sendVoiceChannelNotification(`📢 เข้าห้องเสียง **${channel.name}** ในเซิร์เวอร์ **${guild.name}** แล้ว`);
      await updateBotStatus(channel.name);
    }
  } catch (error) {
    console.error("Error connecting to voice channel:", error);
  }
}

// Event: Bot ready
client.on('ready', async () => {
  console.log(`${client.user.username} is online!`);
  await connectToVoiceChannel();
});

// Event: Voice state update
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.member.id !== client.user.id || newState.guild.id !== serverId) return;

  if (!newState.channelId && oldState.channelId) {
    await sendVoiceChannelNotification(`📤 ออกจากห้องเสียง **${oldState.channel.name}** ในเซิร์เวอร์ **${oldState.guild.name}** แล้ว`);
    await updateBotStatus(null);
    await connectToVoiceChannel();
  } else if (newState.channelId !== oldState.channelId) {
    await sendVoiceChannelNotification(`📥 ย้ายไปห้องเสียง **${newState.channel.name}** ในเซิร์เวอร์ **${newState.guild.name}** แล้ว`);
    await updateBotStatus(newState.channel.name);
  }
});

// ⚠️ Note: Consider storing your token in environment variable for security
client.login('NTE2MjE1Nzc5MDcxNjIzMTcw.G3Pyr9.AS9Climt6Ul0Yn8bqHW2XJ6-X2kvCVdW3EF5RY');
