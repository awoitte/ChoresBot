# ChoresBot

A discord bot to assist in household chore completion. Uses a round-robin system to distribute chores evenly.

---

To build:

`npm run build`

---

To run:

`npm run start` or `node .`

# Environment Variables

DISCORD_TOKEN: your discord bot token ([How to get your token](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))
DISCORD_CHANNEL: text channel on discord to listen and respond in (Default: chores)
FREQUENCY: how often to check for and assign chores in seconds (Default: 120)
POSTGRESQL_ADDON_URI: postgres URI of database (e.g. `postgresql://dbuser:secretpassword@database.server.com:3211/mydb`)
PORT: port for web server to listen on (Default: 80)
VERBOSE: set to "TRUE" to show logs
DEBUG: set to "TRUE" to use alternate testing DB (see below), also enables logs
LOCALE: locale used for date/time formatting ([Formatting info](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)) (Default: en-US)
TIMEZONE: timezone to display times in (Default: EST)

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

NOTE: this database should be empty, the tests will frequently destroy and re-initialize all relevant tables and data.
