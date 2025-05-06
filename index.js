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

let isConnecting = false;

async function sendVoiceChannelNotification(message) {
  const notifyGuild = client.guilds.cache.get(notifyServerId);
  if (!notifyGuild) return;

  const notifyChannel = notifyGuild.channels.cache.get(notifyTextChannelId);
  if (notifyChannel && notifyChannel.isText()) {
    notifyChannel.send(message).catch(console.error);
  }
}

async function connectToVoiceChannel() {
  if (isConnecting) return;

  try {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return;

    const channel = guild.channels.cache.get(voiceChannelId);
    if (!channel || !channel.isVoice()) return;

    const isOccupied = channel.members.some(
      member => member.id !== client.user.id
    );

    if (isOccupied) {
      console.log('Voice channel is occupied. Waiting for it to be free...');

      const interval = setInterval(() => {
        const refreshed = guild.channels.cache.get(voiceChannelId);
        const stillOccupied = refreshed.members.some(
          member => member.id !== client.user.id
        );

        if (!stillOccupied) {
          clearInterval(interval);
          connectToVoiceChannel();
        }
      }, 5000);
      return;
    }

    isConnecting = true;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    const message = `📢 เข้าห้องเสียง **${channel.name}** ในเซิร์เวอร์ **${guild.name}** แล้ว`;
    await sendVoiceChannelNotification(message);

  } catch (error) {
    console.error("Error connecting to voice channel:", error);
  } finally {
    isConnecting = false;
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
    await connectToVoiceChannel();
  } else if (newState.channelId && newState.channelId !== oldState.channelId) {
    const newChannel = newState.channel;
    const message = `📥 ย้ายไปห้องเสียง **${newChannel.name}** ในเซิร์เวอร์ **${newChannel.guild.name}** แล้ว`;
    await sendVoiceChannelNotification(message);
  }
});

client.login('NTE2MjE1Nzc5MDcxNjIzMTcw\.G3Pyr9.AS9Climt6Ul0Yn8bqHW2XJ6-X2kvCVdW3EF5RY'); // เปลี่ยน token!
