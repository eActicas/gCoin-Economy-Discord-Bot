👷 **Requirements:**
Node.js
A MongoDB database
🧹 Preparing the enviroment
Clone this git repository somewhere in your OS, then open the cloned folder with a terminal of your choice and run `npm i`

When all of the dependencies finish installing, you will need to create a config.json file inside the src folder and paste this on it:

- {
- "devs": [""],
- "testGuilds": [""]
- }

- "devs": put here the discord id of all developers of the bot, this will be important to manage slash commands
- "testGuilds": your guilds for testing, developer commands will only register here and the bot will import custom emojis from this servers
- In addition, you will also need to remove the .example from the .env.example file and fill it like this:


- "TOKEN": your discord bot token
- "MONGODB_URI": your mongodb connection uri
- "Authorization": this is only required if your bot is in top.gg and you plan to use the /vote command, in this case you go to https://top.gg/bot/:yourbotid/webhooks and put the token here.

! If everything was done correctly, you just need to open a terminal on the folder and run npm start and the bot should be up and running!
