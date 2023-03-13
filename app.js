const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});
const startTime = new Date();
const trackedChannels = new Set();
const workTimes = {};

function formatDuration(duration) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}


// When the bot starts up, log in to Discord
client.login(
  "MTA4NDYwNjEwNDU1NTc2OTg1Nw.GrUfLs.gdMTcVkCJri29tNLvjNDBuHtyBm2Yz9Obal2FM"
);

// When the bot is ready, log a message to the console
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  }
);

// When a user joins a voice channel, start tracking their time in that channel
client.on("voiceStateUpdate", (oldState, newState) => {
  const user = newState.member;
  const voiceChannel = newState.channel;
  if (voiceChannel && voiceChannel.id === "1084622657498124329") {
    trackedChannels.add(voiceChannel.id);
    if (!workTimes[user.id]) {
      workTimes[user.id] = { total: 0, today: 0 };
    }
    workTimes[user.id].startTime = Date.now();
    console.log(
      `${user.displayName} joined ${voiceChannel.name} at ${new Date()}`
    );
  } else if (trackedChannels.has(oldState.channel?.id)) {
    trackedChannels.delete(oldState.channel.id);
    const workTime = Date.now() - workTimes[user.id].startTime;
    workTimes[user.id].total += workTime / 1000;
    workTimes[user.id].today += workTime / 1000;
    workTimes[user.id].startTime = null;
    console.log(
      `${user.displayName} left ${oldState.channel.name} at ${new Date()}`
    );
  }
});

// When a user leaves a voice channel, stop tracking their time and update their work time
client.on("voiceStateUpdate", (oldState, newState) => {
  const user = newState.member;
  const voiceChannel = oldState.channel;
  if (voiceChannel && trackedChannels.has(voiceChannel.id)) {
    trackedChannels.delete(voiceChannel.id);
    const workTime = Date.now() - workTimes[user.id].startTime;
    workTimes[user.id].total += workTime / 1000;
    workTimes[user.id].today += workTime / 1000;
    workTimes[user.id].startTime = null;
  }
});

// At midnight, log the work times for each user and reset their daily totals
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    const channel = client.channels.cache.get("1084644618408300554");
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
      replyMessage += `${user.username}: ${formatDuration(
        workTimes[userId].today
      )}\n`;
    }
    message.reply(replyMessage);
  } else if (message.content === "/timeslist") {
    let replyMessage = "Total work times:\n";
    for (const userId in workTimes) {
      const user = client.users.cache.get(userId);
      replyMessage += `${user.username}: ${formatDuration(
        workTimes[userId].total
      )}\n`;
    }
    message.reply(replyMessage);
  }
});
