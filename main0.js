var auth = require('./auth.json');

function sendChannel(msgOut, msg){
  console.log("[O]:" + msgOut);
  msg.channel.send(msgOut);
  //msg.channel.fetchMessage(msg.channel.lastMessageID).then(msg => msg.delete());
}

function sendUser(msgOut, msg){
  console.log("[O]:" + msgOut);
  msg.author.send(msgOut);
  //msg.channel.fetchMessage(msg.channel.lastMessageID).then(msg => msg.delete());
}

const Discord = require('discord.js');

/*const embed = new Discord.RichEmbed()
// Set the title of the field
.setTitle('A slick little embed')
// Set the color of the embed
.setColor(0xFF0000)
// Set the main content of the embed
.setDescription('Hello, this is a slick embed!');*/

const client = new Discord.Client({
  token: auth.token,
  autorun: true
});

//SET THESE
//Role message
const ROLE_MESSAGE_ID = 578423051813650432;


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('BEEP BOOP');
  console.log('Ready!');
  console.log('');
});

const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

client.on('raw', async event => {
	if (!events.hasOwnProperty(event.t)) return;
  const { d: data } = event;
  console.log(event);
  reactUser = await client.fetchUser(data.user_id);
  homeGuild = client.guilds.get(data.guild_id);
  guildUser = await homeGuild.fetchMember(data.user_id);
  //console.log(guildUser);
  emojiRole = homeGuild.roles.find(emojiRole => emojiRole.name === data.emoji.name);
  //console.log("SDODGHJDFILUGJHDXFLIUGHJ");
  helloMoto = reactUser.username
  console.log(reactUser);
  if (data.message_id == ROLE_MESSAGE_ID){
    //console.log("hi"+guildUser.user.username);
    if (event.t == 'MESSAGE_REACTION_ADD'){
      console.log(`${guildUser.user.username} added "${data.emoji.name}" to class.`);
      guildUser.addRole(emojiRole);
    }else if(event.t== 'MESSAGE_REACTION_REMOVE'){
      console.log(`${guildUser.user.username} removed their "${data.emoji.name}" class.`);
      guildUser.removeRole(emojiRole);
    }
  }

});


//reacting to emoji sets role
client.on('messageReactionAdd', (reaction, user) => {
  emojiRole = user.lastMessage.member.guild.roles.find(emojiRole => emojiRole.name === reaction.emoji.name);
  if (emojiRole){
    console.log(`${user.username} added "${reaction.emoji.name}" to class.`);
    user.lastMessage.member.addRole(emojiRole);
  }
});

//removing reaction removes role
client.on('messageReactionRemove', (reaction, user) => {
  emojiRole = user.lastMessage.member.guild.roles.find(emojiRole => emojiRole.name === reaction.emoji.name);
  if (emojiRole){
    console.log(`${user.username} removed their "${reaction.emoji.name}" class.`);
    user.lastMessage.member.removeRole(emojiRole);
  }
});


client.on('message', msg => {
  if (msg.content.substring(0, 1) == '!') {
      //Remove ! from command
      var args = msg.content.substring(1).split(' ');
      var cmd = args[0].toLowerCase();
      args = args.splice(1).join(" ");
      if (args){
        argmsg = " *Args: " + args + "*";
      }
      else{
        argmsg = "";
      }
      //return input user
      user = msg.member;
      //console.log(user)
      //Write to powershell
      console.log("[I:"+user+"]:!" + cmd)
      msg.delete(0);
      sendUser("**!" + cmd + "** command received." + argmsg, msg);
      switch(cmd) {
        case 'help':
        case 'hello':
          sendChannel("Hello "+user,msg);
          break;
      }
   }
});

client.login(auth.token)
