const express = require("express");
const nodemailer = require("nodemailer");
const Discord = require("discord.js");
const client = new Discord.Client();
const app = express();

const settings = {
  prefix: '!',
  activity: 'helo',
  botOwner: '139866356890861569',
  token: 'NzUzMDI0OTI3NDA5MzczMjg2.X1gLHQ.NaCzyILEOvCQsPQ82LHIFwU1BvA',
  error: {
    noperm: 'You do not have permission to run this command.'
  }
};

app.use(express.static("public"));

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(settings.activity);
});

function clean(text) {
  if (typeof(text) === "string")
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  else
      return text;
}

function cmdEval(msg) {
  const args = msg.content.split(" ").slice(1);
  if (msg.author.id === settings.botOwner) {
    try {
      const code = args.join(" ");
      let evaled = eval(code);

      if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled);

      msg.channel.send(clean(evaled), {code:"xl"});
    } catch (err) {
      msg.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
  } else {
    msg.reply(settings.error.noperm);
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

function discordOnDm(msg) {
  // body...
}

client.on('message', msg => {
  if (msg.author.bot) return;
  if (msg.channel.type === 'dm') discordOnDm(msg);
  if (discordTryToRunCmd(msg)) return;
});

async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Cypress Discord Verification" <cypress-verification@2d4u.org>', // sender address
    to: "dfox22@santacruzcoe.org", // list of receivers
    subject: "Discord Account Verification", // Subject line
    text: "Your verification code is 1234567.", // plain text body
    html: "Your verification code is <b>1234567</b>.", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

client.login(settings.token);