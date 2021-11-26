# ChoresBot

A Discord bot to assist in household chore completion. Uses a "round-robin" system to distribute chores evenly.

---

To build:

`npm run build`

---

To run:

`npm run start` or `node .`

# Environment Variables

| Env Variable Name    | Description                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| DISCORD_TOKEN        | your Discord bot token ([How to get your token][1])                                                |
| DISCORD_CHANNEL      | text channel on Discord to listen and respond in (Default: chores)                                 |
| FREQUENCY            | how often to check for and assign chores in seconds (Default: 120)                                 |
| POSTGRESQL_ADDON_URI | postgres URI of database (e.g. `postgresql://dbuser:secretpassword@database.server.com:3211/mydb`) |
| PORT                 | port for web server to listen on (Default: 80)                                                     |
| VERBOSE              | set to "TRUE" to show logs                                                                         |
| DEBUG                | set to "TRUE" to use alternate testing DB (see below), also enables logs                           |
| LOCALE               | locale used for date/time formatting ([Formatting info][2]) (Default: en-US)                       |
| TIMEZONE             | timezone to display times in (Default: America/New_York)                                           |
| MORNING_TIME         | Time of day to start assigning chores (Default: 7:00 AM)                                           |
| NIGHT_TIME           | Time of day to stop assigning chores (Default: 11:00 PM)                                           |
| URL                  | URL of the server. Used in links sent to the user. Don't include the last '/' (Default: localhost) |

# Extra Notes

ChoresBot is designed to be used on only _one_ guild (a.k.a. "servers"; Discord calls servers "guilds" internally). If the Discord Application bot has been invited to multiple guilds they will all be listened to and any responses will be posted to each matching channel (channel name is set by `DISCORD_CHANNEL`, see above). This means a user on "Server A" can send the `!help` command and ChoresBot will respond on "Server A" _AND_ "Server B".

---

If you're unsure how to use ChoresBot a good place to start is with the `!help` command. It lists all available commands with a summary. You can provide a command name to get more information, for example `!help add`.

# Dev Environment

To start in debug mode (runs the server with the `DEBUG` environment variable set):

`npm run dev:start`

The server should now be running with the webpage accessible on port 3000.

---

To restart the server in debug mode on file changes:

`npm run watch:all`

The server should now be running with the webpage accessible on port 3000. When a `*.ts` file changes the server will be killed and restarted.

---

To run tests once:

`npm run test`

---

To run tests on any file changes:

`npm run watch:tests`

When a `*.ts` file changes the tests will automatically be re-run.

## DB Testing

In order to run database query unit tests you must have a postgreSQL database running somewhere accessible. Then set the environment variable `CHORES_BOT_TEST_DB` to a postgreSQL connection string (e.g. `postgresql://dbuser:secretpassword@database.server.com:3211/mydb`).

**NOTE**: this database should be disposable, the tests will frequently destroy and re-initialize all relevant tables and data.

# Extending ChoresBot

ChoresBot is written in such a way that replacing Discord for a different chat application should be relatively simple. Theoretically all you need to do is write a new wrapper for the chat client like the one found in `src/external/chat.ts`

It's also possible to replace the Database application used in a similar way via `src/external/db.ts`. However, that will be a bit more involved. If you chose to do this, make sure your new database wrapper passes all tests in `src/external/db.spec.ts`.

[1]: https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot 'Bot Token Instructions'
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation 'Time Formatting Info'
