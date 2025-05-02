const { Client, Intents } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});

client.on('ready', async () => {
  console.log(`${client.user.username} ออนไลน์แล้ว!`);

  try {
    const channel = await client.channels.fetch(process.env.channel);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
  } catch (error) {
    console.error("Error connecting to voice channel:", error);
  }
});

client.login(process.env.token);
