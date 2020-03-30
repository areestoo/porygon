//SETUP
var auth = require('./auth.json');
const EVENT_LOG = ('event_log.json');
var fs = require('fs');
process.env.TZ = 'Europe/Amsterdam'
const Discord = require('discord.js');
const RichEmbed = require ('discord.js');
var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');

const client = new Discord.Client({
  token: auth.token,
  autorun: true
});
const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};
const googleSheetsList = {
  "ONY" : "1Sc5pAoFz0J6e49cWflagyc8ifrUpPn5FgSGXqDseJ0A",
  "MC" : "1bE6X-RnyvhtobsRWl1rszNdYXaMPUFa9CLS_XJApPy8",
  "ALT" : "1bE6X-RnyvhtobsRWl1rszNdYXaMPUFa9CLS_XJApPy8",
  "SPEED" : "1bE6X-RnyvhtobsRWl1rszNdYXaMPUFa9CLS_XJApPy8",
  "BWL" : "1bE6X-RnyvhtobsRWl1rszNdYXaMPUFa9CLS_XJApPy8",
  "ZG" : "",
  "AQ20" : "",
  "AQ40" : "",
  "NAXX" : "",
  "default" : ""
}
const googleSheetsBotSheetTitles = {
  "ONY" : "ONY_Input",
  "MC" : "MC_Input",
  "ALT" : "",
  "SPEED" : "BWL_Input",
  "BWL" : "BWL_Input",
  "ZG" : "",
  "AQ20" : "",
  "AQ40" : "",
  "NAXX" : "",
  "default" : "1 Discord attendance input"
}
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
const wowRaidList = {
  "SPEED" : "https://cdn.discordapp.com/attachments/656609894299861002/665798969191825427/MCSANIC.png",
  "MC" : "https://cdn.discordapp.com/attachments/617592149067825154/664814019101851648/back.png",
  "ONY" : "https://cdn.discordapp.com/attachments/615451658058596355/664789982556323870/ff.png",
  "BWL" : "https://cdn.discordapp.com/attachments/615451658058596355/665176531089490016/UFXGWT6.jpg",
  "ZG" : "",
  "AQ20" : "",
  "AQ40" : "",
  "NAXX" : "",
  "default" : ""
};
const wowRoleList = [
  "tank",
  "warrior",
  "rogue",
  "feral",
  "enhance",
  "hunter",
  "mage",
  "warlock",
  "elemental",
  "shadow",
  "balance",
  "priest",
  "shaman",
  "druid"
];

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
  eventRaidInstance = "default";
  Object.keys(wowRaidList).forEach( (wowRaid) => {
    if (raidID.search(wowRaid) > -1) {
      eventRaidInstance = wowRaid;
    }
  })
  eventRaidInstanceImage = wowRaidList[eventRaidInstance];
  raidEmbed = {
    "title": raidName + " - #" + raidID,
    "description": eventDateTime + "\nAbove is in Server Time. \nPlease RSVP attendance to this raid by clicking on the class/role you intend to come with.",
    "url": "https://docs.google.com/spreadsheets/d/19Y9XkAwTngavgPO2HFhbIfkAOFPM9a9t4pXmf2gVACA/edit?usp=sharing",
    "color": 16376054,
    "timestamp": new Date(),
    "footer": {
      "text": "POSTED",
      "icon_url": "http://fanaru.com/pokemon/image/106936-pokemon-porygon.png",
    },
    "thumbnail": {
      "url": eventRaidInstanceImage
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
    //console.log(sentMsg);
    wowRoleList.forEach(async (wowRoleListItem) => {
      await sentMsg.react(findEmojiID(sentMsg.guild,wowRoleListItem));
    })

    jRaid.embed = eRaid;
    jRaid.users = [];
    writeRaid(jRaid);
  });
}

function findEmojiID(homeGuild, emojiName){
  for(var [eKey, eValue] of homeGuild.emojis){
    //console.log(eValue.name);
    if (emojiName == eValue.name){
      return eValue.id;
    }
  }
  return false;
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
  try{
    data = fs.readFileSync(fileLocation);
    jRaid = JSON.parse(data);
    /*console.log('PARSED DATA:');
    console.log(jRaid);*/
  }
  catch(error){
    console.error(error);
    jRaid = false;
  }
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
  //wowClassIDs = Object.values(wowClass);
  jUser.class = emoji

  return jUser;
}

function updateRaid(messageid,user,added,fs,emoji){
  //pull event list from EVENT_LOG and return specific event from messageID
  jEvent = findEvent(messageid);
  //return if no event found
  if (!jEvent){
    console.log("No matching event found for reaction.")
    return;
  }
  //pull raid event object from id.json
  fileLocation = "raids/" + jEvent.id + ".JSON";
  jRaid = readJSON(fs,fileLocation);
  //create user object from discord object


  //find user if exists, else push new
  if (jRaid){
    jRaidIndex = searchArray(user.user.id, jRaid.users);
    if (jRaidIndex>=0){
      jUser = updateUser(user,added,emoji,jRaid.users[jRaidIndex]);
      jRaid.users[jRaidIndex] = jUser;
    }
    else {
      jUser = updateUser(user,added,emoji,"No User Found");
      jRaid.users.push(jUser);
    }
    //write to object
    writeRaid(jRaid);
  }
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
    docID = "default";
    Object.keys(googleSheetsList).forEach( (wowRaid) => {
      if (args.toString().search(wowRaid) > -1) {
        docID = wowRaid;
      }
    })
    sheetID = "default";
    Object.keys(googleSheetsBotSheetTitles).forEach( (wowRaid) => {
      if (args.toString().search(wowRaid) > -1) {
        sheetID = wowRaid;
      }
    })
    var doc = new GoogleSpreadsheet(googleSheetsList[docID]);
    doc.useServiceAccountAuth(creds, function (err) {
      doc.getInfo(function(err, info) {
        //Find sheet name sheetID variable
        try {
          console.log('\n\nLoaded doc: '+info.title+' by '+info.author.email);
          for (i=0; i<info.worksheets.length; i++){
            if (info.worksheets[i].title == googleSheetsBotSheetTitles[sheetID]){
              var sheet = info.worksheets[i];
              console.log(sheet);
              break;
            }
          }
          console.log('Worksheet selected: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount+'\n');
          //Write to doc
          sheet.getRows(1, function (err, rows) {
            console.log(rows);
            for (i = 0;i<jRaid.users.length;i++){
              rows[i].id = jRaid.users[i].id;
              rows[i].player = jRaid.users[i].name;
              rows[i].class = jRaid.users[i].class;
              rows[i].status = "Attending";
              rows[i].save();
            }
          });
          console.log("Worksheet updated.")
        }
        catch{
          return;
        }
      });
    });
  }
  else{
    sendChannel("Please input raid # using `!update <number>`",msg)
  }
}

function fetchAttendance(args, msg){
	//Define all the variables
	const fetch = require('node-fetch');
	const wclogsauth = require('./wclogsauth.json');
	const wclogsUrl = 'https://classic.warcraftlogs.com:443/v1';
	const wclogsapiKey = wclogsauth.apikey;
  const zoneWeights = {
		moltencore: 30, //Molten Core 3pts per boss
		onyxia: 3, //Onyxia 3pts per boss
    blackwing: 32 //Blackwing Lair 4pts per boss
  }

  class Raider{
    constructor(ign, sheetData){
      this.ign = ign;
      this.AttendancePoints = AttendancePoints;
      this.mcCount = {
        

      };
      this.onyCount = onyCount;
      this.bwlCount = bwlCount;
    }
  }

  try {
    switch (args[0]){
      case "raidlist":
        fetch(wclogsUrl + '/reports/guild/Trivial/Arugal/US' + wclogsapiKey)
              .then(response => response.json())
              .then(data => {
                if (args[1]){
                  var daystosubtract = args[1];
                } else {
                  var daystosubtract = 7;
                }
                var output = '```Trivial Raids in last ' + daystosubtract + ' days.\n';
                var cutoffdate = new Date(Date.now() - (daystosubtract * 24 * 60 * 60 * 1000));
                data.forEach(function(raidID){
                  var raidDate = new Date(0);
                  raidDate.setUTCMilliseconds(raidID.start);
                  var dmraidDate = raidDate.getDate() + "/" + raidDate.getMonth() + "/" + raidDate.getFullYear();
                  if (raidDate.getTime() >= cutoffdate.getTime()){
                    switch (raidID.zone){
                      case 1000:
                        var zoneName = "Molten Core";
                        break;
                      case 1001:
                        var zoneName = "Onyxia's Lair";
                        break;
                      case 1002:
                        var zoneName = "Blackwing Lair";
                        break;
                      default:
                        var zoneName = "Unknown";
                        break;
                    }
                    output += "RaidID: " + raidID.id + "\t\tDate: " + dmraidDate + "\t\tZone: " + zoneName + "\n";
                  }
                })
                output += '```';
                if (output.length <= 2000){
                  sendChannel(output,msg);
                } else {
                  sendChannel('```Requested history too large for discord, please provide a smaller threshhold.```',msg);
                }
                
              })
        break;
      case "fetch":
        if (args[1] && args[1].length == 16){
          raidID = args[1];
          fetch(wclogsUrl + '/report/fights/' + raidID + wclogsapiKey)
          .then(response => response.json())
          .then(data => {
            console.log(data);
            if (data == undefined){
              sendChannel('```Unable to retrieve raid data. Please use !trivialattendance raidlist to determine valid RaidID.```',msg);
            } else {
              var exportedCharacters = data.exportedCharacters;
              switch (data.zone){
                case 1000:
                  var attendanceWeight = zoneWeights.moltencore;
                  break
                case 1001:
                  var attendanceWeight = zoneWeights.onyxia;
                  break
                case 1002:
                  var attendanceWeight = zoneWeights.blackwing;
                  break
                default:
                  var attendanceWeight = 0;
                  break
              }
              var characterlist = '```Attendance Weight: ' + attendanceWeight +"\n";
              exportedCharacters.forEach(function(character){
                characterlist += character.name + "\n";
              })
              if (args[2]){
                sittingCharacters = args[2].split(",");
                sittingCharacters.forEach(function(character){
                  characterlist += character + "\n";
                })
              }
              characterlist += '```';
              sendChannel(characterlist,msg);
            }
          })
        } else {
          sendChannel('```Invalid RaidID provided. Please use !trivialattendance raidlist to determine valid RaidID.```',msg);
        }
        break;
      case "publish":
          if (args[1] && args[1].length == 16){
            raidID = args[1];
            fetch(wclogsUrl + '/report/fights/' + raidID + wclogsapiKey)
            .then(response => response.json())
            .then(data => {
              console.log(data);
              if (data == undefined){
                sendChannel('```Unable to retrieve raid data. Please use !trivialattendance raidlist to determine valid RaidID.```',msg);
              } else {
                var exportedCharacters = data.exportedCharacters;
                switch (data.zone){
                  case 1000:
                    var attendanceWeight = zoneWeights.moltencore;
                    break
                  case 1001:
                    var attendanceWeight = zoneWeights.onyxia;
                    break
                  case 1002:
                    var attendanceWeight = zoneWeights.blackwing;
                    break
                  default:
                    var attendanceWeight = 0;
                    break
                }
                var characterlist = '```Attendance Weight: ' + attendanceWeight +"\n";
                exportedCharacters.forEach(function(character){
                  characterlist += character.name + "\n";
                })
                if (args[2]){
                  sittingCharacters = args[2].split(",");
                  sittingCharacters.forEach(function(character){
                    characterlist += character + "\n";
                  })
                }
                characterlist += '```';
                sendChannel(characterlist,msg);
              }
            })
          } else {
            sendChannel('```Invalid RaidID provided. Please use !trivialattendance raidlist to determine valid RaidID.```',msg);
          }
        break;
      default:
        sendChannel('```USAGE:\n\
!trivialattendance raidlist [<days>]\n\
.Provides raid logs available from past 7 days. <days> is an optional argument to specify an alternate number of days to fetch raid history. If you make this threshold too large, discord isn\'t able to send the message.\n\n\
!trivialattendance fetch <RaidID> [<sittingcharacters>]\n\
.Fetches attendance from specified <RaidID> and returns result to discord channel. Additional Characters can be injected into the output list with the optional <sittingCharacters> argument. This must be a comma seperated string with no spaces. e.g. Vox,Ari,BigChase\n\n\
This is just an initial proof of capability. Further features yet to be developed include automatically pushing attendance data into Google Sheets.```', msg);
        break;
    }  
  } catch (error) {
    console.log(error);
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
  //emojiRole = homeGuild.roles.find(emojiRole => emojiRole.name === data.emoji.name);
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
        case 'trivialattendance':
          fetchAttendance(args, msg);
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
