//SETUP
var auth = require('./auth.json');
const EVENT_LOG = ('event_log.json');
var fs = require('fs');
const ROLE_MESSAGE_ID = 578423051813650432;
process.env.TZ = 'Europe/Amsterdam'
const Discord = require('discord.js');
const RichEmbed = require ('discord.js');
const client = new Discord.Client({
  token: auth.token,
  autorun: true
});
const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};
const wowClass = {
  "Warrior": "567702019985506304",
  "Shaman": "567702022594363398",
  "Hunter": "567702026020978692",
  "Druid": "567702026541072385",
  "Rogue": "567702027631853574",
  "Priest": "567702526489657375",
  "Mage": "567702068874444803",
  "Warlock": "567702028110004225"
};

function addEvent(data){
  eventData = [];
  fileLocation = EVENT_LOG;
  try{
    eventData = fs.readFileSync(fileLocation);
    eventData = JSON.parse(eventData);
  }
  catch(e){
    console.log(e);
    eventData = [];
  }
  eventData.push(data);
  eventData = JSON.stringify(eventData, null, 2);
  fs.writeFileSync(fileLocation, eventData, finished);
  function finished(err){
    console.log("Event added to EVENT_LOG @" + fileLocation);
  }
}

function buildEmbed(raidName, raidID, eventDateTime, userList){
  raidEmbed = {
    "title": raidName + " - #" + raidID,
    "description": "`" + eventDateTime + "`\nPlease RSVP attendance to this raid by with ✅, ❌ or ❓",
    "url": "https://docs.google.com/spreadsheets/d/1wBE0BDcTU5YYjcy4Dcp7gXSMtjsmdFrd_D-0PQ9WNBQ/edit?usp=sharing",
    "color": 16376054,
    "timestamp": new Date(),
    "footer": {
      "text": "POSTED",
      "icon_url": "http://fanaru.com/pokemon/image/106936-pokemon-porygon.png",
    },
    "thumbnail": {
      "url": "https://media-hearth.cursecdn.com/attachments/0/699/ragnaros.png"
    },
    "author": {
      "name": "Porygon Bot",
      "url": "https://gitlab.com/areesto",
      "icon_url": "http://fanaru.com/pokemon/image/106936-pokemon-porygon.png"
    },
    "fields": userList
  };
  return raidEmbed
}

function createRaid(args,msg){
  var jRaid = {};
  jRaid.name = args.shift();
  jRaid.id = args.shift();
  // ... means variable number of args
  jRaid.start = new Date(...args);
  eRaid = buildEmbed(jRaid.name, jRaid.id, jRaid.start,);
  //todo: add users
  jRaid.messageid = msg.channel.send({embed: eRaid}).then(async function (sentMsg) { // 'sent' is that message you just sent
    jRaid.messageid = sentMsg.id;
    console.log("Raid message embed posted @ " + jRaid.messageid);
    console.log('Writing to raid registry.');
    addEvent(jRaid);
    sentMsg.react("✅");
    sentMsg.react("❌");
    sentMsg.react("❓");
    jRaid.embed = eRaid;
    jRaid.users = [];
    writeRaid(jRaid);
  });
}

//Returns event object if exists, else returns false
function findEvent(messageid){
  try{
    eventList = fs.readFileSync(EVENT_LOG);
    eventList = JSON.parse(eventList);
  }
  catch(e){
    console.log(e);
    eventList = [];
    return false;
  }
  for (i=0;i<eventList.length;i++){
    if (eventList[i].messageid == messageid){
      return eventList[i];
    }
  }
  return false;
}

function foundEmoji(emoji){
  switch(emoji){
    case '✅':
      return "Attending"
      break;
    case '❌':
      return "Not attending"
      break;
    case '❓':
      return "Tentative"
      break;
    default:
      return false;
  }
  /*if (emoji == "✅" || emoji == "❌" || emoji == "❓"){
    return true;
  }
  else {
    return false;
  }*/
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function readJSON(fs,fileLocation){
  data = fs.readFileSync(fileLocation);
  jRaid = JSON.parse(data);
  /*console.log('PARSED DATA:');
  console.log(jRaid);*/
  return jRaid;
}

//returns array value for matching user if it exists
function searchArray(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].id == nameKey) {
            return i;
        }
    }
    return -1;
}

function sendChannel(msgOut, msg){
  console.log("[O]:" + msgOut);
  msg.channel.send(msgOut);
}

function sendUser(msgOut, msg){
  console.log("[O]:" + msgOut);
  msg.author.send(msgOut);
}

function updateUser(dUser,status){
  var jUser = {};
  //set discord ID
  jUser.id = dUser.user.id;
  //set discord nickname if exists, else discord name
  if (dUser.nickname != null){
      jUser.name = dUser.nickname;
  }else {
      jUser.name = dUser.user.username;
  }
  //Find User's class by comparing server roles and wowClass. Returns first matching value.
  wowClassIDs = Object.values(wowClass);
  jUser.class = dUser._roles.filter(element => wowClassIDs.includes(element))[0]
  jUser.class = getKeyByValue(wowClass,jUser.class);
  //set status
  jUser.status = status;
  //set comments
  jUser.comment = "Comment test";
  //writeRaid(jUser);
  return jUser;
}

function updateRaid(messageid,user,added,fs,status){
  //pull event list from EVENT_LOG and return specific event from messageID
  jEvent = findEvent(messageid);
  //pull raid event object from id.json
  fileLocation = "raids/" + jEvent.id + ".JSON";
  jRaid = readJSON(fs,fileLocation);
  //create user object from discord object
  if(added){
    jUser = updateUser(user,status);
  }
  else if(!added){
    jUser = updateUser(user,"No status");
  }
  //find user if exists, else push new
  jRaidIndex = searchArray(user.user.id, jRaid.users);
  if (jRaidIndex>=0){
    jRaid.users[jRaidIndex] = jUser;
  }
  else {
    jRaid.users.push(jUser);
  }
  //write to object
  writeRaid(jRaid);
  return;
}

function writeRaid(data){
  fileLocation = "raids/" + data.id + ".json";
  data = JSON.stringify(data, null, 2);
  fs.writeFileSync(fileLocation, data, finished);
  function finished(err){
    console.log("Finished writing to " + fileLocation);
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('BEEP BOOP');
  console.log('Ready!');
  console.log('');
});

client.on('raw', async event => {
	if (!events.hasOwnProperty(event.t)) return;
  const { d: data } = event;
  reactUser = await client.fetchUser(data.user_id);;
  homeGuild = client.guilds.get(data.guild_id);
  guildUser = await homeGuild.fetchMember(data.user_id);
  emojiRole = homeGuild.roles.find(emojiRole => emojiRole.name === data.emoji.name);
  status = foundEmoji(data.emoji.name);
  if (data.message_id == ROLE_MESSAGE_ID){
    if (event.t == 'MESSAGE_REACTION_ADD'){
      console.log(`${guildUser.user.username} added "${data.emoji.name}" to class.`);
      guildUser.addRole(emojiRole);
    }else if(event.t== 'MESSAGE_REACTION_REMOVE'){
      console.log(`${guildUser.user.username} removed their "${data.emoji.name}" class.`);
      guildUser.removeRole(emojiRole);
    }
  }
  else if (status && !reactUser.bot){
    if (event.t == 'MESSAGE_REACTION_ADD'){
      updateRaid(data.message_id,guildUser,true,fs,status);
    }else if(event.t== 'MESSAGE_REACTION_REMOVE'){
      updateRaid(data.message_id,guildUser,false,fs,status);
    }
  }
});

//reacting to emoji sets role
client.on('messageReactionAdd', (reaction, user) => {
  /*emojiRole = user.lastMessage.member.guild.roles.find(emojiRole => emojiRole.name === reaction.emoji.name);
  if (emojiRole){
    console.log(`${user.username} added "${reaction.emoji.name}" to class.`);
    user.lastMessage.member.addRole(emojiRole);
  }*/
});

//removing reaction removes role
client.on('messageReactionRemove', (reaction, user) => {
  /*emojiRole = user.lastMessage.member.guild.roles.find(emojiRole => emojiRole.name === reaction.emoji.name);
  if (emojiRole){
    //console.log(`${user.username} removed their "${reaction.emoji.name}" class.`);
    user.lastMessage.member.removeRole(emojiRole);
  }*/
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
      args = args.split(" ");
      user = msg.member;
      //Write to powershell
      console.log("[I:"+user+"]:!" + cmd)
      msg.delete(0);
      //sendUser("**!" + cmd + "** command received." + argmsg, msg);
      switch(cmd) {
        case 'help':
        case 'hello':
          sendChannel("Hello "+user,msg);
          break;
        case 'raid':
          //format - !raid <name> <id> <yyyy> <mm> <dd> <hh> <mm> <ss>
          createRaid(args,msg);
          break;
      }
   }
});

client.login(auth.token)
