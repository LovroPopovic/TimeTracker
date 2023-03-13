# Discord Bot

This is a simple Discord bot that replies to user messages with a greeting.

## Requirements

* Node.js
* Discord.js version 13.1.0

## Getting Started

1. Clone this repository to your local machine.
2. Install the dependencies by running `npm install`.
3. Create a new Discord application and add a bot to it.
4. Copy the bot token and add it to the `client.login()` method in `index.js`.
5. Update the `voiceChannel.id` and `channel.id` variables in `index.js` with the IDs of your voice channel and the channel where you want to send the work times message.
6. Run the bot with `node app.js`.

## Usage

The bot listens for two commands in chat:

- `/times`: Sends a message with the work times for each user for the current day.
- `/timeslist`: Sends a message with the total work times for each user.


