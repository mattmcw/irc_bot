# irc_bot

Node.js module for sending and routing messages on a single irc channel.


## Installation

Install this module in your node.js project.

```
npm install --save git+https://github.com/mattmcw/irc_bot.git
```

## Example

Set up your environment with the following variables:

* IRC_SERVER : server hostname
* IRC_USERNAME : username/nick
* IRC_PASSWORD : (optional) server password
* IRC_CHANNEL : (optional) channel
* IRC_PORT : (optional) port [6667:6697]
* IRC_SSL : (optional) use ssl [0:1]
* IRC_SELF_SIGNED : (optional) allow self-signed certs [0:1]			


Import the IRCBot class and create a bot with a new instance.

```
const { IRCBot } = require('irc_bot');

const bot = new IRCBot({}, (from, to, evt) => {
	console.log('irc_bot event received!');
	console.dir(evt);
});

```