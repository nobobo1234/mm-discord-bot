const Discord = require('discord.js');
const schedule = require('node-schedule');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const stripIndent = require('strip-indent');
const config = require('./config.json');

const adapter = new FileSync('db.json');
const db = low(adapter);
const bot = new Discord.Client();
const commands = new Discord.Collection();

bot.on('ready', () => {
    console.log('Bot is ready!');

    const commandFilenames = fs.readdirSync('./commands/');
    for(const filename of commandFilenames) {
        const name = filename.split('.')[0];
        const command = require(`./commands/${name}`);

        commands.set(name, command);
    }

    const job = schedule.scheduleJob('* 17 * * *', async () => {
        const now = new Date();
        const m = await bot.channels.get('617689768830042139')
            .send(stripIndent(`
                **Daily check-in post of ${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}**
                Hello Miracle Morning challengers, this is your daily check-in post!

                React with the following emojis for every segment of your morning routine that you completed today:
                :pray: S - silence/meditation
                :trophy: A - affirmations
                :clapper: V - visualization
                :muscle: E - exercise
                :books: R - reading
                :writing_hand: S - scribing/journaling
            `));
        await m.react('\uD83D\uDE4F') // Praying emoji
        await m.react('\uD83C\uDFC6') // Trophy emoji
        await m.react('\uD83C\uDFAC') // Clapper board emoji
        await m.react('\uD83D\uDCAA') // Muscle emoji
        await m.react('\uD83D\uDCDA') // Books emoji
        await m.react('\u270D');

        db.set('lastMessageId', m.id).write();
    });
});

bot.on('messageReactionAdd', (reaction, user) => {
    if(reaction.message.id !== db.get('lastMessageId').value()) return;
    if(user.id === reaction.message.author.id) return;
    
    const emoji = reaction.emoji.name;
    const userId = user.id;
    
    const userData = db.get('users').find({ id: userId }).value() || 
        {
            silence: 0,
            affirmations: 0,
            visualization: 0,
            exercise: 0,
            reading: 0,
            scribing: 0,
            id: userId
        };

    switch(emoji) {
        case '\uD83D\uDE4F':
            userData.silence++;
            break;
        case '\uD83C\uDFC6':
            userData.affirmations++;
            break;
        case '\uD83C\uDFAC':
            userData.visualization++;
            break;
        case '\uD83D\uDCAA':
            userData.exercise++;
            break;
        case '\uD83D\uDCDA':
            userData.reading++;
            break;
        case '\u270D':
            userData.scribing++;
            break;
        default:
            break;
    }

    if(db.get('users').find({ id: userId }).value())
        db.get('users').find({ id: userId }).set(userData).write();
    else
        db.get('users').push(userData).write();
});

bot.on('messageReactionRemove', (reaction, user) => {
    if(reaction.message.id !== db.get('lastMessageId').value()) return;
    if(user.id === reaction.message.author.id) return;
    
    const emoji = reaction.emoji.name;
    const userId = user.id;
    
    const userData = db.get('users').find({ id: userId }).value();

    switch(emoji) {
        case '\uD83D\uDE4F':
            userData.silence--;
            break;
        case '\uD83C\uDFC6':
            userData.affirmations--;
            break;
        case '\uD83C\uDFAC':
            userData.visualization--;
            break;
        case '\uD83D\uDCAA':
            userData.exercise--;
            break;
        case '\uD83D\uDCDA':
            userData.reading--;
            break;
        case '\u270D':
            userData.scribing--;
            break;
        default:
            break;
    }

    db.get('users').find({ id: userId }).set(userData).write();
});

bot.on('message', async (msg) => {
    if (!msg.author.bot) {
        const { prefix } = config;
        const { content } = msg;

        if (!content.startsWith(prefix)) return;

        const args = msg.content.slice(prefix.length).trim().split(/ +/g);
        const base = args.shift().toLowerCase();

        const command = commands.get(base);

        if(command) {
            try {
                await command.run(bot, msg, args, db);
            } catch(e) {
                msg.channel.send(`:x: Oops, this happened: ${e}`);
            }
        } else {
            msg.channel.send(':x: The command could not be found');
        }
    }
});

bot.login(config.token);

