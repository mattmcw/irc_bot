'use strict';

/**
 * Example IRCBot use case. This will create a new IRCBot from a configuration object,
 * and add a message router method to print all messages as JSON
 * Run example with username and password from root of module as so:
 *
 * USERNAME=name PASSWORD=password node examples/
 **/

const { IRCBot } = require('../dist/')

const config = {
	server : 'localhost',
	username : process.env.USERNAME,
	password : null,
	channel : 'dev'
}

function router (from, to, evt) {
	console.log(JSON.stringify(evt));
	if (evt.action && evt.action === 'message') {
		setTimeout(function () {
			bot.say('That\'s so cool, man!');
		}, 1000);
	}
}

 const bot = new IRCBot(config, router);

 setTimeout(function () {
 	bot.say('Bot here, reporting in.');
 }, 2000);