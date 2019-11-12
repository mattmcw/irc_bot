'use strict'

const { IRCBot } = require('../dist/index.js')

const bot = new IRCBot({}, (from, to, evt) => {
	console.log('irc_bot event received!');
	console.dir(evt);
});
