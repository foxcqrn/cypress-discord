const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
const Discord = require('discord.js');
const {Client, Intents} = require('discord.js');
const client = new Discord.Client({
  allowedMentions : {parse : [ 'users', 'roles' ], repliedUser : true},
  intents : [
    Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGES
  ],
  ws : {
    properties : {'$os' : 'iOS', '$browser' : 'Discord iOS', '$device' : ''}
  },
  partials : [ 'MESSAGE', 'CHANNEL', 'REACTION' ]
});

const settings = {
  prefix : '!',
  activity : 'helo',
  botOwner : '139866356890861569',
  token : 'NzUzMDI0OTI3NDA5MzczMjg2.X1gLHQ.NaCzyILEOvCQsPQ82LHIFwU1BvA',
  guildid : '884926502951616572',
  errors : {noperm : 'You do not have permission to run this command.'},
  roles : {verified : '885057017276936262'}
};

let activeCodes = [];
let transporter = nodemailer.createTransport({
  host : "smtp.gmail.com",
  port : 587,
  secure : false, // upgrade later with STARTTLS
  auth : {
    user : "cypressverify@gmail.com",
    pass : "vssZCRWKXyZmW6",
  },
});

app.use(express.static('public'));

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(settings.activity);
});

function clean(text) {
  if (typeof (text) === 'string')
    return text.replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203));
  else
    return text;
}

function cmdEval(msg) {
  const args = msg.content.split(' ').slice(1);
  if (msg.author.id === settings.botOwner) {
    try {
      const code = args.join(' ');
      let evaled = eval(code);

      if (typeof evaled !== 'string')
        evaled = require('util').inspect(evaled);

      msg.channel.send(`\`\`\`js\n${clean(evaled)}\n\`\`\``)
          .catch(console.error);
    } catch (err) {
      msg.channel.send(`\`ERROR\` \`\`\`\n${clean(err)}\n\`\`\``)
          .catch(console.error);
    }
  } else {
    msg.reply(settings.errors.noperm);
  }
}

const kCommands = {
  'eval' : cmdEval,
};

function discordTryToRunCmd(msg) {
  if (!msg.content.startsWith(settings.prefix))
    return false;
  const cmd = msg.content.slice(1).toLowerCase().split(' ', 1)[0];
  const fn = kCommands[cmd];
  if (!fn)
    return false;
  fn(msg);
  return true;
}

async function discordOnDm(msg) {
  let guild = await client.guilds.cache.get(settings.guildid);
  let guildMember = await guild.members.fetch(msg.author.id);
  let isVerified = await guildMember.roles.cache.has(settings.roles.verified);
  if (isVerified)
    return;
  let email = msg.content;
  let verifyNumber = Math.floor(Math.random() * 999999);
  if (activeCodes.some(user => user.id === msg.author.id)) {
    if (activeCodes.some(user => user.code === parseInt(msg.content))) {
      msg.channel.send(
          'Success! Your account is now verified. Welcome to the Cypress High School Discord server!');
      activeCodes.splice(
          activeCodes.findIndex(user => user.id === msg.author.id), 1);
      guildMember.roles.add(settings.roles.verified);
      return;
    } else {
      msg.channel.send(
          'Invalid verification code. Please reply with your school email to start the verification process.');
      activeCodes.splice(
          activeCodes.findIndex(user => user.id === msg.author.id), 1);
    }
  }
  if (!email.endsWith('@santacruzcoe.org')) {
    msg.channel.send(
        'Please reply with your school email to start the verification process.');
    return;
  }
  console.log('sending code to ' + email);
  try {
    let info = await transporter.sendMail({
      from :
          'Cypress Discord Verification <cypressverify@gmail.com>', // sender
                                                                    // address
      to : email,                               // list of receivers
      subject : 'Discord Account Verification', // Subject line
      text :
          'Hello! Your verification code is ' + verifyNumber +
              '. If you didn\'t request this code, please ignore this email.', // plain text body
      html :
          'Hello! Your verification code is <b>' + verifyNumber +
              '</b>. If you didn\'t request this code, please ignore this email.', // html body
    });
    activeCodes.push({email : email, code : verifyNumber, id : msg.author.id});
    console.log(info, activeCodes);
    msg.channel.send(
        'I sent a code to `' + email +
        '`. Please reply with the code sent in order to gain access to the server.');
  } catch (err) {
    msg.channel.send('I couldn\'t send an email to the address given. ```' +
                     err + '```');
    console.log(err);
    return;
  }
}

client.on('messageCreate', msg => {
  if (msg.author.bot)
    return;
  if (msg.channel.type === 'DM')
    discordOnDm(msg);
  if (discordTryToRunCmd(msg))
    return;
});

client.on('guildMemberAdd', member => {
  member.send(`Welcome to the Cypress High School Discord server ${
      member.user
          .username}! Please reply with your school email to start the verification process.`);
});

client.login(settings.token);