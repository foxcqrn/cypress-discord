const express = require("express");
const nodemailer = require("nodemailer");
const Discord = require("discord.js");
const client = new Discord.Client();
const app = express();

const prefix = "!";
const activitymsg = "helo";
const devid = "139866356890861569";
const token = "NzUzMDI0OTI3NDA5MzczMjg2.X1gLHQ.NaCzyILEOvCQsPQ82LHIFwU1BvA";
var mainguild;
var mainguildid = "753004453077975080";

var breakoutSessions = [];
const filter = (response, user) => {
  return !isNaN(parseInt(response.content)) && user.id !== client.user.id;
}
const filter2 = (response, user) => {
    return response.content.toLowerCase() === "no" || response.content.toLowerCase() === "yes" && user.id !== client.user.id;
  };

app.use(express.static("public"));

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(activitymsg);
  mainguild = await client.guilds.cache.get(mainguildid);
});

client.on("message", msg => {
  const channel = msg.channel.id;
  const m = msg.content.toLowerCase();
  if (m.startsWith(prefix + "eval")) {
    if (msg.member.id === devid) {
      try {
        msg.channel.send(eval(msg.content.slice(6)));
      } catch (e) {
        msg.channel.send(msg.author.toString() + ", " + e);
      }
    } else {
      msg.reply("You do not have permission to run this command.");
    }
  } else if (m.startsWith("breakout")) {
    if (msg.channel.name === "teacher-controls") {
      if (msg.member.roles.cache.find(r => r.name === "Teacher")) {
        if (msg.member.voice.channel) {
          if (msg.member.voice.channel.name === "Classroom Voice") {
            var studentNum = msg.member.voice.channel.members.filter(members => members.roles.cache.has(msg.guild.roles.cache.find(role => role.name === "Student").id)).size;
            var perGroupNum;
            var sessionLength;
            var manualSort;
            msg.channel.send(embed("#f58d42", ":grey_question: **How many students per group?** There are " + studentNum + " students in the classroom.")).then(() => {
              msg.channel.awaitMessages(filter, { max: 1 }).then(r1 => {
                perGroupNum = r1.first().content;
                msg.channel.send(embed("#f58d42", ":grey_question: **How long should the breakout session last in minutes?** (You can end it at any time by typing \"breakout end\")")).then(() => {
                  msg.channel.awaitMessages(filter, { max: 1 }).then(r2 => {
                    sessionLength = parseInt(r2.first().content);
                    msg.channel.send(embed("#f58d42", ":grey_question: **Would you like students to be automatically placed in the groups?** __(reply with yes/no)__ If not, you will need to manually drag each student to a room.")).then(() => {
                      msg.channel.awaitMessages(filter2, { max: 1 }).then(r3 => {
                        if (r3.first().content === "yes") {
                          manualSort = false;
                        } else if (r3.first().content === "no") {
                          manualSort = true;
                        }
                        msg.channel.send(embed("#45f542", ":white_check_mark: Creating breakout rooms..."));
                        msg.reply("studentNum=" + studentNum + " perGroupNum=" + perGroupNum + " sessionLength*60000=" + sessionLength*60000 + "manualSort=" + manualSort);
                        let groupNum = Math.floor(studentNum/perGroupNum)
                        for (var i=0; i<groupNum; i++) {
                          let roomNum = i+1;
                          msg.guild.channels.create("Breakout Room " + roomNum, {type: "category", position: "0"}).then(category => {
                            msg.guild.channels.create("room-" + roomNum + "-chat", {type: "text", parent: category}).then(text => {
                              msg.reply(text.id);
                            });
                            msg.guild.channels.create("Room " + roomNum + " Voice", {type: "voice", parent: category}).then(voice => {
                              msg.reply(voice.id);
                            });
                            msg.reply(category.id);
                          }).catch(console.error);
                        }
                      });
                    });
                  });
                });
              });
            });
          } else {
            msg.reply("You must be in the Classroom Voice channel to use this command.")
          }
        } else {
            msg.reply("You must be in the Classroom Voice channel to use this command.")
        }
      } else {
        msg.reply("You do not have permission to run this command.");
      }
    }
  } else if (m.startsWith(prefix + "testmail")) {
    msg.reply("done");
    main().catch(console.error);
  }
});

function embed(color, description, fields, url) {
  var embed = new Discord.MessageEmbed()
  embed.setDescription(description)
  embed.setColor(color);
  if (fields) {
    let fieldarray = fields.split(",");
    for (var i=0; i<fieldarray.length; i++) {
      embed.addField(fieldarray[i].split("|")[0], fieldarray[i].split("|")[1]);
    }
  }
  if (url) {
    embed.setImage(url);
  }
  return embed;
}

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

client.login(token);