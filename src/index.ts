'use strict';

import { Client } from 'irc';

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const IRC_SERVER : string = typeof process.env.IRC_SERVER === 'string' ?
										process.env.IRC_SERVER : 'irc.chat.twitch.tv';
const IRC_USERNAME : string = typeof process.env.IRC_USERNAME === 'string' ?
										process.env.IRC_USERNAME : null;
const IRC_PASSWORD : string = typeof process.env.IRC_PASSWORD === 'string' ?
										process.env.IRC_PASSWORD : null;
const IRC_CHANNEL : string = typeof process.env.IRC_CHANNEL === 'string' ?
										process.env.IRC_CHANNEL : null;
const IRC_PORT : number = typeof process.env.IRC_PORT === 'string' ? 
										parseInt(process.env.IRC_PORT, 10) : null;
const IRC_SSL : boolean = (typeof process.env.IRC_SSL === 'undefined' 
							|| process.env.IRC_SSL == '0') ? 
										false : true;
const IRC_SELF_SIGNED : boolean = (typeof process.env.IRC_SELF_SIGNED === 'undefined' 
									|| process.env.IRC_SELF_SIGNED == '0') ? 
										false : true;				

interface Config {
	server? : string;
	username? : string;
	password? : string;
	channel? : string;
}

interface EventObject {
	timestamp : number;
	bot : string;
	action : string;
	from : string;
	to : string;
	channel : string;
	message : string;
}

/**
 * IRCBot framework.
 **/

class IRCBot {
	private channel : string;
	private server : string;// "irc.freenode.net",
	private botName : string;
	private password : string;
	private client : Client;
	private msgRouter : any;
	private port : number;
	private ssl : boolean = false;
	private selfSigned : boolean = false;

	/**
	 * @constructor
	 * Start bot with connection to channel configured with either environment variables
	 * or, if supplied, a configuration object.
	 **/
	constructor (config : any = {}, msgRouter : Function = () => {}) {
		let clientConfig : any;
		this.msgRouter = msgRouter;
		this.server = typeof config.server !== 'undefined' ? config.server : IRC_SERVER;
		this.botName = typeof config.username !== 'undefined' ? config.username : IRC_USERNAME;
		this.password = typeof config.password !== 'undefined' ? config.password : IRC_PASSWORD;
		this.channel = typeof config.channel !== 'undefined' ? config.channel : IRC_CHANNEL;
		if (this.channel.substring(0, 1) !== '#') {
			this.channel = `#${this.channel}`;
		}
		if (typeof IRC_PORT === 'number') {
			this.port = IRC_PORT;
		}
		if (typeof config.port !== 'undefined') {
			this.port = config.port;
		}

		if (IRC_SSL || (typeof config.ssl !== 'undefined' && config.ssl === true)) {
			this.ssl = true;
		}

		if (IRC_SELF_SIGNED || (typeof config.selfSigned !== 'undefined' && config.selfSigned === true)) {
			this.selfSigned = true;
		}

		clientConfig = {
			channels: [this.channel],
			realName : this.botName,
			userName : this.botName,
			password : this.password,
			//debug : true,
			//showErrors: true,
			//sasl: false,
			autoRejoin: true, // auto rejoin channel when kicked
			autoConnect: true, // persistence to connect
		}

		if (this.port) {
			clientConfig.port = this.port;
		}
		if (this.ssl) {
			clientConfig.secure = true;
		}
		if (this.selfSigned) {
			clientConfig.selfSigned = true;
		}

		console.dir(clientConfig)
		this.client = new Client(this.server, this.botName, clientConfig);
		this.listeners();
		this.connect();
	}

	/**
	 * Subscribe listeners to the client. Route all events through the
	 * onMessage method, which will pass messages to the router if defined
	 **/
	private listeners () {
		//this.client.addListener('raw', this.onRaw.bind(this));
		this.client.addListener('error', this.onError.bind(this));
		this.client.addListener('join', this.onJoin.bind(this));
		this.client.addListener('part', this.onPart.bind(this));
		this.client.addListener('quit', this.onQuit.bind(this));
		this.client.addListener('pm', this.onPM.bind(this));
		this.client.addListener('kick', this.onKick.bind(this));
		this.client.addListener('message', this.onMessage.bind(this));
	}
	private onRaw (raw : any) {
		console.dir(raw);
	}
	/**
	 * On a channel error, create an EventObject and pass to msgRouter method.
	 **/
	public onError (message : any) {
	    const evt : EventObject = this.eventObject(this.botName, this.botName, 'error', JSON.stringify(message));
	     console.error(`[${this.channel}] ERROR: %s: %s`, message.command, message.args.join(' '));
	    this.msgRouter(this.botName, this.botName, evt);
	}

	/**
	 * When a user joins, create an EventObject and pass to msgRouter method.
	 **/
	public onJoin (channel : string, who : string) {
		who = typeof who !== 'string' ? this.botName : who;
		const message : string = `User ${who} joined [${this.channel}]`;
	    const evt : EventObject = this.eventObject(who, this.botName, 'join', message);
	    console.log(`[${this.channel}] JOIN %s => %s: %s`, who, this.botName, evt.message);
	    this.msgRouter(who, this.botName, evt);
	}

	/**
	 * When a user parts, create an EventObject and pass to msgRouter method.
	 **/
	public onPart (channel : string, who : string, reason : string) {
		const message : string = `User ${who} parted [${channel}] ${reason}`;
	    const evt : EventObject = this.eventObject(who, this.botName, 'part', message);
	    console.log(`[${this.channel}] PART %s => %s: %s`, who, this.botName, evt.message);
	    this.msgRouter(who, this.botName, evt);
	}

	/**
	 * When a user quits, create an EventObject and pass to msgRouter method.
	 **/
	public onQuit (channel : string, who : string, reason : string) {
		const message : string = `User ${who} quit [${channel}] ${reason}`;
	    const evt : EventObject = this.eventObject(who, this.botName, 'quit', message);
	    console.log(`[${this.channel}] QUIT %s => %s: %s`, who, this.botName, evt.message);
	    this.msgRouter(who, this.botName, evt);
	}

	/**
	 * When a user PMs the bot, create an EventObject and pass to msgRouter method.
	 **/
	public onPM (from : string, message : string) {
		const evt : EventObject = this.eventObject(from, this.botName, 'pm', message);
		console.log(`[${this.channel}] PM %s => %s: %s`, from, this.botName, evt.message);
		this.msgRouter(from, this.botName, evt);
	}

	/**
	 * When a user is kicked, create an EventObject and pass to msgRouter method.
	 **/
	public onKick (channel : string, who : string, by : string, reason : string) {
		const message : string = `${who} was kicked from [${channel}] by ${by} ${reason}`;
		const evt : EventObject = this.eventObject(by, who, 'kick', message);
		console.log(`[${this.channel}] KICK %s => %s: %s`, by, who, evt.message);
		this.msgRouter(by, who, evt);
	}

	/**
	 * When a user posts a message, create an EventObject and pass to msgRouter method.
	 **/
	public onMessage (from : any, to : any, message : any) {
		const evt : EventObject = this.eventObject(from, to, 'message', message);
		console.log(`[${this.channel}] %s => %s: %s`, from, to, evt.message);
		this.msgRouter(from, to, evt);
	}

	/**
	 * Connect the bot to a channel.
	 **/
	private connect () {
		console.log(`Bot connecting to [${this.channel}]`);
		this.client.join(`${this.channel}`);
	}

	/**
	 * Returns a UTC timestamp in millisections.
	 **/ 
	private timestamp () : number {
		return Date.now();
	}

	/**
	 * Create an event object to pass to the message router.
	 **/
	private eventObject (from : string, to : string, action : string,  message: string) : EventObject {
		return   {  
			timestamp : this.timestamp(),
			bot : this.botName,
			action, 
			from,
			to,
	    	channel : this.channel, 
			message 
		}
	}

	/**
	 * Broadcast a message to the channel as the bot.
	 **/
	public say (message : string) {
		console.log(`[%s] %s => %s`, this.channel, this.botName, message);
		this.client.say(this.channel, message);
	}
}

module.exports.IRCBot = IRCBot

