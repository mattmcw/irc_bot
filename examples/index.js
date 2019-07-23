'use strict';

/**
 * Example IRCBot use case. This will create a new IRCBot from a configuration object,
 * and add a message router method to print all messages as JSON
 * Run example with username and password from root of module as so:
 *
 * IRC_SERVER= IRC_USERNAME=name IRC_PASSWORD=password node examples/
 **/

const { IRCBot } = require('../dist/')

const JOINING = ['I\'m back!', 'Grettings ladies and germs', 'What did I miss?', 'What\s happenin?']
const GREETINGS = [ 'Greetings', 'Hi', 'Hey', 'Yo', 'What\'s good', 'Howdy', 'Sup'];
const RESPONSE = ['Absolutely wild', 'Is that for real?', 'Too cool', 'If you say so!', 'Wow...', 'For sure, man', 'Absolutely', 'Haha', 'lol', 'lmao', 'nooooo', 'really?', ';_;', 'ok', 'okay...'];
const PARTING = ['I loved them...', 'Good riddance!', 'Thank goodness they finally left', 'They will be missed'];

//Bad random function
function randomInt (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function router (from, to, evt) {
	if (evt.action && evt.action === 'join') {
		if (evt.bot === evt.from) {
			//don't greet yourself
			return false
		}
		setTimeout(function () {
			//be polite
			const greeting = GREETINGS[randomInt(0, GREETINGS.length - 1)];
			bot.say(`${greeting} ${from}`);
		}, randomInt(200, 2000));
	}

	if (evt.action && (evt.action === 'quit' || evt.action === 'part')) {
		setTimeout(function () {
			//be polite
			const parting = PARTING[randomInt(0, PARTING.length - 1)];
			bot.say(parting);
		}, randomInt(500, 4000));
	}

	if (evt.action && evt.action === 'message') {
		setTimeout(function () {
			//be sarcastic
			const response = RESPONSE[randomInt(0, RESPONSE.length - 1)]
			bot.say(response);
		}, randomInt(500, 10000));
	}
}

 const bot = new IRCBot({}, router);

 setTimeout(function () {
 	const joining = JOINING[randomInt(0, JOINING.length - 1)];
 	bot.say(joining);
 }, randomInt(500, 3000));