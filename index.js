import 'dotenv/config';
import { Client } from 'discord.js-selfbot-v13';
import { joinVoiceChannel } from '@discordjs/voice';
import express from 'express';

// Express Server
const app = express();
const port = process.env.PORT || 3500;
app.get('/', (_, res) => res.send('Bot is running'));
app.listen(port, () => console.log(`Express server listening on port ${port}`));

// Discord Selfbot
const client = new Client({});

const serverId = process.env.server;
const id = process.env.id; // Voice Channel ID

let reconnectAttempts = 0;
const maxReconnects = 5; // reconnect สูงสุดต่อ interval

async function tryJoinChannel(guild, channel) {
  try {
    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true, // ป้องกัน crash encryption
      selfMute: true,
      group: 'default',
    });
    console.log(`✅ Joined voice channel: ${channel.name}`);
    return true;
  } catch (err) {
    console.error("❌ Voice connection failed:", err.message);
    return false;
  }
}

client.on('ready', async () => {
  console.log(`${client.user.username} is online!`);
  await client.user.setPresence({ status: 'online' });

  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(serverId);
      if (!guild) return;

      const channel = guild.channels.cache.get(id);
      if (!channel) {
        console.error("❌ Target voice channel not found");
        return;
      }

      const me = guild.members.cache.get(client.user.id);
      const currentChannelId = me?.voice?.channelId;

      if (currentChannelId !== id) {
        if (reconnectAttempts < maxReconnects) {
          reconnectAttempts++;
          console.log(`🔁 Bot is not in voice channel. Attempting reconnect ${reconnectAttempts}/${maxReconnects}...`);
          await tryJoinChannel(guild, channel);
        } else {
          console.log("⚠️ Max reconnect attempts reached. Waiting for next interval...");
          reconnectAttempts = 0; // reset รอบถัดไป
        }
      } else {
        reconnectAttempts = 0; // reset reconnect ถ้าอยู่ในห้อง
        console.log("✅ Bot is in the voice channel.");
      }
    } catch (err) {
      console.error("Interval check error:", err);
    }
  }, 10000); // เช็คทุก 10 วิ
});

client.login(process.env.token);
