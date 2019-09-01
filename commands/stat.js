const { RichEmbed } = require('discord.js');

exports.run = (bot, msg, args, db) => {
    const userData = db.get('users').find({ id: msg.author.id }).value() ||
        {
            silence: 0,
            affirmations: 0,
            visualization: 0,
            exercise: 0,
            reading: 0,
            scribing: 0
        };

    const embed = new RichEmbed()
        .setAuthor(msg.author.username, msg.author.displayAvatarURL)
        .setTitle('Miracle Morning Stats')
        .setDescription('Amount of times someone has done the six life savers')
        .addField(':pray: Silence', `${userData.silence} times`, true)
        .addField(':trophy: Affirmations', `${userData.affirmations} times`, true)
        .addField(':clapper: Visualization', `${userData.visualization} times`, true)
        .addField(':muscle: Exercise', `${userData.exercise} times`, true)
        .addField(':books: Reading', `${userData.reading} times`, true)
        .addField(':writing_hand: Scribing/Journaling', `${userData.scribing} times`, true);

    msg.channel.send(embed);
};
