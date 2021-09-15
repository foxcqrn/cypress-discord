const express = require('express');
const nodemailer = require('nodemailer');
const Discord = require('discord.js');
const {Client, Intents} = require('discord.js');
const client = new Discord.Client({
  ws: {
    intents: Intents.ALL,
    properties: {'$os': 'iOS', '$browser': 'Discord iOS', '$device': ''}
  },
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});
const app = express();

const settings = {
  prefix: '!',
  activity: 'helo',
  botOwner: '139866356890861569',
  token: 'NzUzMDI0OTI3NDA5MzczMjg2.X1gLHQ.NaCzyILEOvCQsPQ82LHIFwU1BvA',
  guildid: '884926502951616572',
  errors: {
    noperm: 'You do not have permission to run this command.'
  },
  roles: {
    verified: '885057017276936262'
  }
};

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: "cypressverify@gmail.com",
    pass: "vssZCRWKXyZmW6",
  },
});

app.use(express.static('public'));

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(settings.activity);
});

function clean(text) {
  if (typeof(text) === 'string')
    return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
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

      msg.channel.send(clean(evaled), {code:'js'});
    } catch (err) {
      msg.channel.send(`\`ERROR\` \`\`\`\n${clean(err)}\n\`\`\``);
    }
  } else {
    msg.reply(settings.errors.noperm);
  }
}

const kCommands = {
  'eval': cmdEval,
};

function discordTryToRunCmd(msg) {
  if (!msg.content.startsWith(settings.prefix)) return false;
  const cmd = msg.content.slice(1).toLowerCase().split(' ', 1)[0];
  const fn = kCommands[cmd];
  if (!fn) return false;
  fn(msg);
  return true;
}

async function discordOnDm(msg) {
  try {
    let guild = await client.guilds.cache.get(settings.guildid);
    let isVerified = await (await guild.members.fetch(msg.author.id)).roles.cache.has(settings.roles.verified);
    if (isVerified) return;
    let email = msg.content;
    let verifyNumber = Math.floor(1000 + (9999 - 1000) * Math.random());
    if (!email.endsWith('@santacruzcoe.org')) {
      msg.channel.send('Please reply with your school email to start the verification process.');
      return;
    }
    console.log(email);
    let info = await transporter.sendMail({
      from: 'Cypress Discord Verification <cypressverify@gmail.com>', // sender address
      to: email, // list of receivers
      subject: 'Discord Account Verification', // Subject line
      text: 'Your verification code is ' + verifyNumber, // plain text body
      html: 'Your verification code is <b>' + verifyNumber + '</b>', // html body
    });

  } catch (err) {
    console.log(err);
  }
}

client.on('message', msg => {
  if (msg.author.bot) return;
  if (msg.channel.type === 'dm') discordOnDm(msg);
  if (discordTryToRunCmd(msg)) return;
});

client.on('guildMemberAdd', member => {
  member.send(`Welcome to the Cypress High School Discord server ${member.username}! Please reply with your school email to start the verification process.`);
});

/*async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: ''Cypress Discord Verification' <cypress-verification@2d4u.org>', // sender address
    to: 'dfox22@santacruzcoe.org', // list of receivers
    subject: 'Discord Account Verification', // Subject line
    text: 'Your verification code is 1234567.', // plain text body
    html: 'Your verification code is <b>1234567</b>.', // html body
  });

  console.log('Message sent: %s', info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}*/

client.login(settings.token);