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
	server : '127.0.0.1',
	username : process.env.USERNAME,
	password : process.env.PASSWORD,
	channel : 'dev'
}

function router (from, to, evt) {
	console.log(JSON.stringify(evt));
}

 const bot = new IRCBot(config, router);