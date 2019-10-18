//SETUP
var auth = require('./auth.json');
const EVENT_LOG = ('event_log.json');
var fs = require('fs');
process.env.TZ = 'Europe/Amsterdam'
const Discord = require('discord.js');
const RichEmbed = require ('discord.js');
var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');
// doc URL ID (pull from URL)
var doc = new GoogleSpreadsheet('1bE6X-RnyvhtobsRWl1rszNdYXaMPUFa9CLS_XJApPy8');
botWorksheetTitle = 'Discord attendance input';

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
    "description": "`" + eventDateTime + "``\nAbove is in Server Time. \nPlease RSVP attendance to this raid by with ✅, ❌ or ❓",
    "url": "https://docs.google.com/spreadsheets/d/19Y9XkAwTngavgPO2HFhbIfkAOFPM9a9t4pXmf2gVACA/edit?usp=sharing",
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
  jRaid.start = new Date(...args).toLocaleString("en-us",{timeZone: "Australia/Melbourne", timeZoneName: "short"});
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

function findFutureRaids(){
  try{
    eventList = fs.readFileSync(EVENT_LOG);
    eventList = JSON.parse(eventList);
  }
  catch(e){
    console.log(e);
    eventList = [];
    return false;
  }
  currentDateTime = new Date();
  newEventList = [];
  //Scan event log for all events, and compare if current time/date is before the listed one
  //Push to returning array if time has not passed.
  for (i=0;i<eventList.length;i++){
    if (currentDateTime>new Date(eventList[i].start)){
    }
    else {
      newEventList.push(eventList[i]);
    }
  }
  if (newEventList.length){
    return newEventList;
  }
  else {
    return false;
  }
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

function updateUser(dUser,added,emoji,recordedUser){
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

  //set status array
  //[ATTENDING,TENTATIVE,NOTATTENDING]
  if(recordedUser != "No User Found"){
    jUser.status = recordedUser.status
  }
  else{
    //console.log("wtf")
    jUser.status = ["","",""];
  }
  if (added){
    switch(emoji){
      case '❌':
        jUser.status[0] = "Not attending"
        break;
      case '❓':
        jUser.status[1] = "Tentative"
        break;
      case '✅':
        jUser.status[2] = "Attending"
        break;
    }
  }
  else {
    switch(emoji){
      case '❌':
        jUser.status[0] = ""
        break;
      case '❓':
        jUser.status[1] = ""
        break;
      case '✅':
        jUser.status[2] = ""
        break;
    }
  }
  return jUser;
}

function updateRaid(messageid,user,added,fs,status){
  //pull event list from EVENT_LOG and return specific event from messageID
  jEvent = findEvent(messageid);
  //pull raid event object from id.json
  fileLocation = "raids/" + jEvent.id + ".JSON";
  jRaid = readJSON(fs,fileLocation);
  //create user object from discord object


  //find user if exists, else push new
  jRaidIndex = searchArray(user.user.id, jRaid.users);
  if (jRaidIndex>=0){
    jUser = updateUser(user,added,status,jRaid.users[jRaidIndex]);
    jRaid.users[jRaidIndex] = jUser;
  }
  else {
    jUser = updateUser(user,added,status,"No User Found");
    jRaid.users.push(jUser);
  }
  //write to object
  writeRaid(jRaid);
  return;
}

/*function newUpdate(args, msg){
  futureRaids = findFutureRaids();
  for (i=0;i<futureRaids.length;i++){
    console.log(futureRaids[i]);
    msg.channel.fetchMessage(futureRaids[i].messageid)
      .then(message => findReactions(message))
      .catch(console.error);
  }
}*/

/*function findReactions(msg){
  //Scans reactions for map users for each emoji
  //then pushes to array
  homeGuild = client.guilds.get(msg.member.guild.id);
  eventChannel = msg.channel;

  usersReacted = [[],[],[]];;
  for (const [keys, values] of msg.reactions.filter(a => a._emoji.name == '✅').get('✅').users.entries()) {
    usersReacted[0].push(keys);
  }
  for (const [keys, values] of msg.reactions.filter(a => a._emoji.name == '❓').get('❓').users.entries()) {
    usersReacted[1].push(keys);
  }
  for (const [keys, values] of msg.reactions.filter(a => a._emoji.name == '❌').get('❌').users.entries()) {
    usersReacted[2].push(keys);
  }
  console.log(usersReacted);
}*/

function writeRaid(data){
  fileLocation = "raids/" + data.id + ".json";
  data = JSON.stringify(data, null, 2);
  fs.writeFileSync(fileLocation, data, finished);
  function finished(err){
    console.log("Finished writing to " + fileLocation);
  }
}

function writeSpreadsheet(args,msg){
  //console.log(args);
  if (args != ''){
    jRaid = readJSON(fs,"raids/" + args + ".JSON");
    // Authenticate with the Google Spreadsheets API.
    doc.useServiceAccountAuth(creds, function (err) {
      doc.getInfo(function(err, info) {
        //Find sheet name from botWorksheetTitle variable
        console.log('\n\nLoaded doc: '+info.title+' by '+info.author.email);
        for (i=0; i<info.worksheets.length; i++){
          if (info.worksheets[i].title == botWorksheetTitle){
            var sheet = info.worksheets[i];
            break;
          }
        }
        console.log('Worksheet selected: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount+'\n');
        //Write to doc
        sheet.getRows(1, function (err, rows) {
          for (i = 0;i<jRaid.users.length;i++){
            rows[i].id = jRaid.users[i].id;
            rows[i].player = jRaid.users[i].name;
            rows[i].class = jRaid.users[i].class;
            if (jRaid.users[i].status[0]){
              rows[i].status = jRaid.users[i].status[0];
            }
            else if (jRaid.users[i].status[1]){
              rows[i].status = jRaid.users[i].status[1];
            }
            else if (jRaid.users[i].status[2]){
              rows[i].status = jRaid.users[i].status[2];
            }
            else {
              rows[i].status = "No Status"
            }
            rows[i].save();
          }
        });
        console.log("Worksheet updated.")
      });
    });
  }
  else{
    sendChannel("Please input raid # using `!update <number>`",msg)
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
  eventChannel = await client.channels.get(data.channel_id);

  if (!reactUser.bot){
      eventMessage = await eventChannel.fetchMessage(data.message_id);
      //console.log(eventMessage.reactions);
      eventIterator = eventMessage.reactions.entries();
      let eventResult = eventIterator.next();
      while (!eventResult.done) {
       tempValue = eventResult.value;
       //console.log(tempValue);
       eventResult = eventIterator.next();
      }

    if (event.t == 'MESSAGE_REACTION_ADD'){
      updateRaid(data.message_id,guildUser,true,fs,data.emoji.name);
    }else if(event.t== 'MESSAGE_REACTION_REMOVE'){
      updateRaid(data.message_id,guildUser,false,fs,data.emoji.name);
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
        case 'porygon':
          sendChannel("```!raid <name> <id> yyyy mm(-1) dd hh mm ss``` in LOCAL time format.",msg);
          break;
        case 'hello':
          sendChannel("Hello "+user,msg);
          break;
        case 'raid':
          //format - !raid <name> <id> <yyyy> <mm> <dd> <hh> <mm> <ss>
          createRaid(args,msg);
          break;
        case 'potato':
          writeSpreadsheet(args,msg);
          break;
        case 'update':
          writeSpreadsheet(args,msg);
          break;
        default:
          console.log("Command not recognized, not doing anything.");
      }
   }
});

client.login(auth.token)
