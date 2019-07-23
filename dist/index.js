'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const irc_1 = require("irc");
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const IRC_SERVER = typeof process.env.IRC_SERVER === 'string' ?
    process.env.IRC_SERVER : 'irc.chat.twitch.tv';
const IRC_USERNAME = typeof process.env.IRC_USERNAME === 'string' ?
    process.env.IRC_USERNAME : null;
const IRC_PASSWORD = typeof process.env.IRC_PASSWORD === 'string' ?
    process.env.IRC_PASSWORD : null;
const IRC_CHANNEL = typeof process.env.IRC_CHANNEL === 'string' ?
    process.env.IRC_CHANNEL : null;
const IRC_PORT = typeof process.env.IRC_PORT === 'string' ?
    parseInt(process.env.IRC_PORT, 10) : null;
const IRC_SSL = (typeof process.env.IRC_SSL === 'undefined'
    || process.env.IRC_SSL == '0') ?
    false : true;
const IRC_SELF_SIGNED = (typeof process.env.IRC_SELF_SIGNED === 'undefined'
    || process.env.IRC_SELF_SIGNED == '0') ?
    false : true;
/**
 * IRCBot framework.
 **/
class IRCBot {
    /**
     * @constructor
     * Start bot with connection to channel configured with either environment variables
     * or, if supplied, a configuration object.
     **/
    constructor(config = {}, msgRouter = () => { }) {
        this.ssl = false;
        this.selfSigned = false;
        let clientConfig;
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
            realName: this.botName,
            userName: this.botName,
            password: this.password,
            //debug : true,
            //showErrors: true,
            //sasl: false,
            autoRejoin: true,
            autoConnect: true,
        };
        if (this.port) {
            clientConfig.port = this.port;
        }
        if (this.ssl) {
            clientConfig.secure = true;
        }
        if (this.selfSigned) {
            clientConfig.selfSigned = true;
        }
        //console.dir(clientConfig)
        this.client = new irc_1.Client(this.server, this.botName, clientConfig);
        this.listeners();
        this.connect();
    }
    /**
     * Subscribe listeners to the client. Route all events through the
     * onMessage method, which will pass messages to the router if defined
     **/
    listeners() {
        //this.client.addListener('raw', this.onRaw.bind(this));
        this.client.addListener('error', this.onError.bind(this));
        this.client.addListener('join', this.onJoin.bind(this));
        this.client.addListener('part', this.onPart.bind(this));
        this.client.addListener('quit', this.onQuit.bind(this));
        //this.client.addListener('pm', this.onPM.bind(this)); //pms are duplicate right now
        this.client.addListener('kick', this.onKick.bind(this));
        this.client.addListener('message', this.onMessage.bind(this));
    }
    onRaw(raw) {
        console.dir(raw);
    }
    /**
     * On a channel error, create an EventObject and pass to msgRouter method.
     **/
    onError(message) {
        const evt = this.eventObject(this.botName, this.botName, 'error', JSON.stringify(message));
        console.error(`[${this.channel}] ERROR: %s: %s`, message.command, message.args.join(' '));
        this.msgRouter(this.botName, this.botName, evt);
    }
    /**
     * When a user joins, create an EventObject and pass to msgRouter method.
     **/
    onJoin(channel, who) {
        who = typeof who !== 'string' ? this.botName : who;
        const message = `User ${who} joined [${this.channel}]`;
        const evt = this.eventObject(who, this.botName, 'join', message);
        console.log(`[${this.channel}] JOIN %s => %s: %s`, who, this.botName, evt.message);
        this.msgRouter(who, this.botName, evt);
    }
    /**
     * When a user parts, create an EventObject and pass to msgRouter method.
     **/
    onPart(channel, who, reason) {
        const message = `User ${who} parted [${channel}] ${reason}`;
        const evt = this.eventObject(who, this.botName, 'part', message);
        console.log(`[${this.channel}] PART %s => %s: %s`, who, this.botName, evt.message);
        this.msgRouter(who, this.botName, evt);
    }
    /**
     * When a user quits, create an EventObject and pass to msgRouter method.
     **/
    onQuit(channel, who, reason) {
        const message = `User ${who} quit [${channel}] ${reason}`;
        const evt = this.eventObject(who, this.botName, 'quit', message);
        console.log(`[${this.channel}] QUIT %s => %s: %s`, who, this.botName, evt.message);
        this.msgRouter(who, this.botName, evt);
    }
    /**
     * When a user PMs the bot, create an EventObject and pass to msgRouter method.
     **/
    onPM(from, message) {
        const evt = this.eventObject(from, this.botName, 'pm', message);
        console.log(`[${this.channel}] PM %s => %s: %s`, from, this.botName, evt.message);
        this.msgRouter(from, this.botName, evt);
    }
    /**
     * When a user is kicked, create an EventObject and pass to msgRouter method.
     **/
    onKick(channel, who, by, reason) {
        const message = `${who} was kicked from [${channel}] by ${by} ${reason}`;
        const evt = this.eventObject(by, who, 'kick', message);
        console.log(`[${this.channel}] KICK %s => %s: %s`, by, who, evt.message);
        this.msgRouter(by, who, evt);
    }
    /**
     * When a user posts a message, create an EventObject and pass to msgRouter method.
     **/
    onMessage(from, to, message) {
        const evt = this.eventObject(from, to, 'message', message);
        console.log(`[${this.channel}] %s => %s: %s`, from, to, evt.message);
        this.msgRouter(from, to, evt);
    }
    /**
     * Connect the bot to a channel.
     **/
    connect() {
        console.log(`Bot connecting to [${this.channel}]`);
        this.client.join(`${this.channel}`);
    }
    /**
     * Returns a UTC timestamp in millisections.
     **/
    timestamp() {
        return Date.now();
    }
    /**
     * Create an event object to pass to the message router.
     **/
    eventObject(from, to, action, message) {
        return {
            timestamp: this.timestamp(),
            bot: this.botName,
            action,
            from,
            to,
            channel: this.channel,
            message
        };
    }
    /**
     * Broadcast a message to the channel as the bot.
     **/
    say(message) {
        console.log(`[%s] %s => %s`, this.channel, this.botName, message);
        this.client.say(this.channel, message);
    }
}
module.exports.IRCBot = IRCBot;
//# sourceMappingURL=index.js.map