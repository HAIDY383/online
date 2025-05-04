// index.js

const { Client, Intents } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require("express");

const app = express();
const port = process.env.PORT || 3500;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port);

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const serverId = '970470272530542642';
const voiceChannelId = '1166411014691115259';
const notifyServerId = '1273594630276911127';
const notifyTextChannelId = '1367228382512943114';

async function sendVoiceChannelNotification(message) {
  const notifyGuild = client.guilds.cache.get(notifyServerId);
  if (!notifyGuild) return;

  const notifyChannel = notifyGuild.channels.cache.get(notifyTextChannelId);
  if (notifyChannel && notifyChannel.isText()) {
    notifyChannel.send(message).catch(console.error);
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
    if (!guild) return;

    const channel = guild.channels.cache.get(voiceChannelId);
    if (channel && channel.isVoice()) {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      const message = `📢 เข้าห้องเสียง **${channel.name}** ในเซิร์เวอร์ **${guild.name}** แล้ว`;
      await sendVoiceChannelNotification(message);
      await updateBotStatus(channel.name);
    }
  } catch (error) {
    console.error("Error connecting to voice channel:", error);
  }
}

client.on('ready', async () => {
  console.log(`${client.user.username} is online!`);
  await connectToVoiceChannel();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.member.id !== client.user.id) return;
  if (newState.guild.id !== serverId) return;

  if (!newState.channelId && oldState.channelId) {
    const leftChannel = oldState.channel;
    const message = `📤 ออกจากห้องเสียง **${leftChannel.name}** ในเซิร์เวอร์ **${leftChannel.guild.name}** แล้ว`;
    await sendVoiceChannelNotification(message);
    await updateBotStatus(null);
    await connectToVoiceChannel();
  } else if (newState.channelId && newState.channelId !== oldState.channelId) {
    const newChannel = newState.channel;
    const message = `📥 ย้ายไปห้องเสียง **${newChannel.name}** ในเซิร์เวอร์ **${newChannel.guild.name}** แล้ว`;
    await sendVoiceChannelNotification(message);
    await updateBotStatus(newChannel.name);
  }
});

client.login('NTE2MjE1Nzc5MDcxNjIzMTcw.G3Pyr9.AS9Climt6Ul0Yn8bqHW2XJ6-X2kvCVdW3EF5RY');
