const Discord = require("discord.js");
const fs = require('fs');
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});
const startTime = new Date();
const trackedChannels = new Set();
let workTimes = {};

function loadData() {
  try {
    const data = fs.readFileSync('./worktimes.json');
    workTimes = JSON.parse(data);
  } catch (err) {
    console.error(err);
  }
}
function saveData() {
  fs.writeFile('./worktimes.json', JSON.stringify(workTimes), err => {
    if (err) {
      console.error(err);
    }
  });
}

function formatDuration(duration) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}


// When the bot starts up, log in to Discord
client.login(
  "MTA4NDYwNjEwNDU1NTc2OTg1Nw.GlXNFk.aOuO1k3hz5D_MpPkeUWJRItB5h2_lFK7qQJ3T0"
);

// When the bot is ready, log a message to the console
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Load the workTimes object from the file
  fs.readFile('./worktimes.json', 'utf8', (err, data) => {
    
    if (err) {
      console.error(err);
      
    } else {
      workTimes = JSON.parse(data);
      
    }
  });
  
});
client.on("voiceStateUpdate", (oldState, newState) => {
  const user = newState.member;
  const voiceChannel = newState.channel || oldState.channel;
  if (!voiceChannel || voiceChannel.id !== "1084622657498124329") {
    return;
  }
  
  const muted = user.voice.selfMute || user.voice.serverMute;
  const deafened = user.voice.selfDeaf || user.voice.serverDeaf;
  const status = muted || deafened ? "muted/deafened" : "unmuted/undeafened";
  
  if (oldState.channelId !== voiceChannel.id && newState.channelId === voiceChannel.id) {
    // User joined the working room
    trackedChannels.add(voiceChannel.id);
    if (!workTimes[user.id]) {
      workTimes[user.id] = { total: 0, today: 0 };
    }
    workTimes[user.id].startTime = Date.now();
    console.log(`${user.displayName} joined ${voiceChannel.name} at ${new Date()}`);
  } else if (oldState.channelId === voiceChannel.id && newState.channelId !== voiceChannel.id) {
    // User left the working room
    trackedChannels.delete(voiceChannel.id);
    const workTime = Date.now() - workTimes[user.id].startTime;
    workTimes[user.id].total += workTime / 1000;
    workTimes[user.id].today += workTime / 1000;
    workTimes[user.id].startTime = null;
    console.log(`${user.displayName} left ${voiceChannel.name} at ${new Date()}`);
    fs.writeFile('./worktimes.json', JSON.stringify(workTimes), err => {
      if (err) {
        console.error(err);
      }
    });
  } else if (oldState.selfMute !== newState.selfMute || oldState.selfDeaf !== newState.selfDeaf) {
    // User was muted/deafened or unmuted/undeafened
    console.log(`${user.displayName} was ${status} by the server or ${status} themselves`);
  }
});

// At midnight, log the work times for each user and reset their daily totals
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 00 && now.getMinutes() === 00) {
    const channel = client.channels.cache.get("1084956858902650900");
    let message = `Work times for ${now.toDateString()}:\n`;
    for (const userId in workTimes) {
      const user = client.users.cache.get(userId);
      message += `${user.username}: ${formatDuration(
        workTimes[userId].today
      )} today, ${formatDuration(workTimes[userId].total)} total\n`;
      workTimes[userId].today = 0;
    }
    channel.send(message);
  }
}, 60000);

// Listen for commands in chat
client.on("messageCreate", (message) => {
  if (message.content === "/times") {
    let replyMessage = "Today's work times:\n";
    for (const userId in workTimes) {
      const user = client.users.cache.get(userId);
      if (user) {
        replyMessage += `${user.username}: ${formatDuration(
          workTimes[userId].today
        )}\n`;
      }
    }
    message.reply(replyMessage);
  } else if (message.content === "/timeslist") {
    let replyMessage = "Total work times:\n";
    for (const userId in workTimes) {
      const user = client.users.cache.get(userId);
      if (user) {
        replyMessage += `${user.username}: ${formatDuration(
          workTimes[userId].total
        )}\n`;
      }
    }
    message.reply(replyMessage);
  }
});

