const Discord = require('discord.js');
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const voiceChannelTime = new Map(); // Map to store voice channel time for each user
const voiceChannelHistory = new Map(); // Map to store voice channel history for each user

// Function to convert time in milliseconds to a human-readable format
function formatTime(time) {
  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Event listener for when the bot is ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Event listener for when a user joins a voice channel
client.on('voiceStateUpdate', (oldState, newState) => {
  if (!newState.channel || newState.member.user.bot) return; // Ignore if user left or if it's a bot
  
  const userId = newState.member.user.id;
  const channelId = newState.channel.id;
  const now = Date.now();
  
  // Update the user's voice channel time
  if (!voiceChannelTime.has(userId)) {
    voiceChannelTime.set(userId, {});
  }
  if (!voiceChannelTime.get(userId)[channelId]) {
    voiceChannelTime.get(userId)[channelId] = { time: 0, lastJoinTime: now };
  }
  else {
    const timeElapsed = now - voiceChannelTime.get(userId)[channelId].lastJoinTime;
    voiceChannelTime.get(userId)[channelId].time += timeElapsed;
    voiceChannelTime.get(userId)[channelId].lastJoinTime = now;
  }
  
  // Update the user's voice channel history
  if (!voiceChannelHistory.has(userId)) {
    voiceChannelHistory.set(userId, {});
  }
  if (!voiceChannelHistory.get(userId)[channelId]) {
    voiceChannelHistory.get(userId)[channelId] = { time: 0 };
  }
  voiceChannelHistory.get(userId)[channelId].time += now - voiceChannelTime.get(userId)[channelId].lastJoinTime;
});

// Command to display users' time spent in a voice channel today
client.on('message', message => {
  if (message.content === '/times') {
    const channelId = message.member.voice.channelID;
    if (!channelId) {
      return message.reply('You must be in a voice channel to use this command!');
    }
    const voiceChannel = message.guild.channels.cache.get(channelId);
    const usersInChannel = voiceChannel.members.filter(member => !member.user.bot);
    let response = 'Time spent in this channel today:\n';
    for (const [userId, userData] of voiceChannelTime) {
      if (userData[channelId]) {
        const timeToday = Date.now() - userData[channelId].lastJoinTime;
        if (timeToday > 0) {
          response += `${message.guild.members.cache.get(userId).displayName}: ${formatTime(timeToday)}\n`;
        }
      }
    }
    if (response === 'Time spent in this channel today:\n') {
      response += 'No one has joined this channel today.';
    }
    message.channel.send(response);
  }
  client.on('message', message => {
    if (message.content === '/timelist') {
      const channelId = message.member.voice.channelID;
      if (!channelId) {
        return message.reply('You must be in a voice channel to use this command!');
      }
      const voiceChannel = message.guild.channels.cache.get(channelId);
      const usersInChannel = voiceChannel.members.filter(member => !member.user.bot);
      let response = 'Total time spent in this channel:\n';
      for (const [userId, userData] of voiceChannelHistory) {
        if (userData[channelId]) {
          response += `${message.guild.members.cache.get(userId).displayName}: ${formatTime(userData[channelId].time)}\n`;
        }
      }
      if (response === 'Total time spent in this channel:\n') {
        response += 'No one has joined this channel yet.';
      }
      message.channel.send(response);
    }
  });
  
  // Function to write voice channel history to a log at midnight
  function writeVoiceChannelHistory() {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      const fs = require('fs');
      const logData = [];
      for (const [userId, userData] of voiceChannelHistory) {
        for (const [channelId, channelData] of Object.entries(userData)) {
          logData.push(`${userId},${channelId},${channelData.time}`);
        }
      }
      fs.appendFileSync('voiceChannelLog.csv', logData.join('\n') + '\n');
      voiceChannelHistory.clear();
    }
  }
  
  // Set up the bot to write voice channel history to a log at midnight
  setInterval(writeVoiceChannelHistory, 60000);
  
  // Authenticate and log in the bot
  client.login('MTA4NDYwNjEwNDU1NTc2OTg1Nw.GrUfLs.gdMTcVkCJri29tNLvjNDBuHtyBm2Yz9Obal2FM');
});