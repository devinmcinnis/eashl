var stats  = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/members-list',
    games  = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/match-results?type=all',
    findClubs = 'http://www.easportsworld.com/p/easw/a/easwclub/s/gs/blaze/401A0001/clubs/findClubs?cfli%7C=1&cfli%7C0=224&clti=1&mxrc=1',
    game_id = '';

var request = require('request')
    express = require('express')
  , app     = express()
  , api_env = app.get('env')
  , cheerio = require('cheerio')
  , orm     = require('orm')
  , configs = require('../config')(api_env)
  , parseString = require('xml2js').parseString
  , et      = require('elementtree')
  , inflector = require('inflector');

function timeToHuman(time) {
  var theDate = new Date(time * 1000);
  dateString = theDate.toGMTString();
  return dateString;
}

exports.player = function (req, res) {
  var player = [];

  return orm.connect(configs.postgres.url, function (err, db) {
    db.load('./models/models', function (err) {
      var stats = db.models.stats;
      stats.find({name: req.params.id}, ['date_played', 'Z'], function (err, stat) {
        res.render('player', {
          title: req.params.id,
          stats: stat,
          playername: req.params.id
        });
      });
    });
  });
  
};
  
exports.index = function(req, res){
  return res.render('index', { 
    title: 'Terrible Stat Logger'
  });
};

exports.getLatestGame = function () {

  var self = this,
      game_players = [];
      self.team = {};
      self.game = {};

  console.log('Getting the latest game information..');
  // console.log('This may take a minute or so.');
  
  return request({uri: games}, function (err, response, body) {

    if ( err && response.statusCode != 200 ) {console.log('Request error.')}

    var $ = cheerio.load(body);
    var body = $('#widgets > table > tbody > tr:first-child');
    var gameId = body.find('.match-details-button').attr('rel');

    self.game.game_id = gameId + '';

    return getPlayersOfLastGame();

  });

  function getPlayersOfLastGame() {
    var game = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/match-results/details?match_id='+ self.game.game_id + '&type=all';

    // console.log('Getting a list of the players that played in the last game...');

    // Tell the request that we want to fetch eashl.com, send the restuls to a function
    return request({uri: game}, function (err, response, body) {
      // Basic error check
      if ( err && response.statusCode != 200 ) {console.log('Request error.')}
        
        $ = cheerio.load(body);
        var body = $('body'),
        players = body.find('.yui-u.first tr > th > div > a');

        players.each(function() {
          game_players.push($(this).text());
        });

        return getPlayerStatsOfLastGame();
    });
  }

  function getPlayerStatsOfLastGame() {

    // console.log('Getting the stats of the players in the last game...');

    // Tell the request that we want to fetch eashl.com, send the restuls to a function
    return request({uri: stats}, function (err, response, body) {
      // Basic error check
      if ( err && response.statusCode != 200 ) {console.log('Request error.')}
        var $ = cheerio.load(body),
        player = $('tbody tr');

        player.each(function (i, row) {
          var row = $(row);
          var playername = row.find('td:nth-child(2) a').text();
         
          game_players.map(function (callback, key) {
            if (game_players[key] == playername) {
              self.team[playername] = {};
              var category = row.find('td');

              category.each(function (i, stat) {
                var statname = $(stat).attr('title');
                if ( i > 2 ) {
                  statname = statname.toLowerCase().replace(/[^0-9a-z-]/g,"");
                  self.team[playername][statname] = $(stat).text();
                }
              });
            }
          });
        });

        return getGameInfoOfLastGame();
    });
  }

  function getGameInfoOfLastGame() {

    // console.log('Getting game information of the most recent game played...');
    return request({uri: findClubs}, function (err, response, gameBody) {

      if ( err && response.statusCode != 200 ) {console.log('Request error.')}

      return parseString(gameBody, {trim: true}, function (err, gameXML) {
        var gameInfoBody = gameXML.findclubs.clublist[0].club[0];

        self.game['team1_score'] = parseInt(gameInfoBody.clubinfo[0].lastgameresult[0], 10);
        self.game['team2_score'] = parseInt(gameInfoBody.clubinfo[0].lastgameresult[0].split(':')[1], 10);
        self.game['team1_id'] = parseInt(gameInfoBody.clubid[0]);
        self.game['team1_name'] = gameInfoBody.name[0];
        self.game['team1_abbr'] = gameInfoBody.clubsettings[0].nonuniquename[0];
        self.game['team2_id'] = parseInt(gameInfoBody.clubinfo[0].lastoppo[0], 10);

        self.date = timeToHuman(gameInfoBody.clubinfo[0].lastgametime[0]);

        return request({uri: 'http://www.easportsworld.com/p/easw/a/easwclub/s/gs/blaze/401A0001/clubs/findClubs?cfli%7C=1&cfli%7C0='+self.game.team2_id+'&clti=1&mxrc=1'}, function (err, response, oppoBody) {

          return parseString(oppoBody, {trim: true}, function (err, oppoXML) {
            var opponentXML = oppoXML.findclubs.clublist[0].club[0];
            self.game['team2_name'] = opponentXML.name[0];
            self.game['team2_abbr'] = opponentXML.clubsettings[0].nonuniquename[0];
            return logResults();
          });
        });
      });
    }); 
  }

  function logResults() {
    // console.log('Results of the last game played:')
    // console.log(self);

    return orm.connect(configs.postgres.url, function(err, db) {
      return db.load('./models/models', function (err) {
        if (err) console.log(err);

        var oldstat = db.models.oldstats;
        var newstat = db.models.stats;
        var Game    = db.models.games;

        Game.create([self.game], function (err, item) {
          if (err) console.log(err);
        });

        for (var playername in self.team) {
          oldstat.find({name: playername}, function (err, person) {

            var newPlayerStat = {
              name: person[0].name
            };

            for (var statcat in self.team[playername]) {
              newPlayerStat[statcat] = self.team[person[0].name][statcat] - person[0][statcat];
            }

            newPlayerStat.shootingpercentage = (newPlayerStat.goals === 0) ? 0 : ((newPlayerStat.goals / newPlayerStat.shots) * 100).toFixed(2);

            newPlayerStat.savepercentage = (newPlayerStat.savepercentage === 0) ? 0 : (((newPlayerStat.totalgoalsagainst + newPlayerStat.saves) / newPlayerStat.saves)).toFixed(3);

            newPlayerStat['date_played'] = self.date;

            newstat.create([newPlayerStat], 
              function (err, item) {
              if (err) console.log(err);
            });
            
            newPlayerStat = {};

          });
        }
        console.log('Stat collection complete.');
        return exports.fillStats(self['date']);
      });
    });
  }
};

exports.fillStats = function (date) {

  var team = {
    oldstats: {}
  };

  return request({uri: stats}, function (err, response, statsBody) {

    if ( err && response.statusCode != 200 ) {console.log('Request error.')}
    
    var teamRecord = 'http://www.easportsworld.com/en_US/clubs/401A0001/224/overview',
    $ = cheerio.load(statsBody),
    player = $('tbody tr');

    player.each(function (i, row) {
      var row = $(row);
      var playername = row.find('td:nth-child(2) a').text();
      var category = row.find('td');

      team.oldstats[playername] = {};

      category.each(function (i, stat) {
        var statname = $(stat).attr('title');
        if ( i > 2 ) {
          statname = statname.toLowerCase().replace(/[^0-9a-z-]/g,"");
          team.oldstats[playername][statname] = $(stat).text();
        }
      });
    });

    return request({uri: teamRecord}, function (err, response, recordBody) {
      if ( err && response.statusCode != 200 ) {console.log('Request error.');}
      
      var $ = cheerio.load(recordBody);
      var $body = $('.current-season-club-stats-main-container'),
      record = $body.find('tr.strong > td:nth-child(2) span.black').text().split(' - ');

      return orm.connect(configs.postgres.url, function(err, db) {
        return db.load('./models/models', function (err) {
          if (err) console.log(err);
          
          var oldstat = db.models.oldstats;
              oldstat.find({}).remove(function (err) {
                if (err) console.log(err);
              });
          var playerObj = {};

          for (var player in team.oldstats) {
            playerObj.name = player;
            for (var stat in team.oldstats[player]) {
              statname = stat.toLowerCase().replace(/[^0-9a-z-]/g,"");
              playerObj[statname] = parseFloat(team.oldstats[player][stat], 10);
            }
            oldstat.create([playerObj], function (err, item) {
              if (err) console.log(err)
            });
            playerObj = {};
          }

          // Update records tables in database
          var Record = db.models.records;

          return Record.create([{
            team_id: 224,
            name: 'Puck Goes First',
            wins: record[0],
            losses: record[1],
            otl: record[2],
            last_game: date
          }], function (err, team) {
            if (err) { return console.log(err); }
            return console.log('Created new record of '+record[0]+'-'+record[1]+'-'+record[2]);
          });
        });
      });
    });
  });
}

exports.whosOnline = function (req, res) {
    
  var onlineInfo = {};

  return request('http://www.easportsworld.com/p/easw/a/easwclub/s/gs/blaze/401A0001/clubs/findClubs?cfli%7C=1&cfli%7C0=224&clti=1&mxrc=1', function (err, response, body) {

    parseString(body, {trim: true}, function (err, result) {
      var membersonline = result.findclubs.clublist[0].club[0].clubinfo[0].memberonlinestatuscounts[0];
      onlineInfo[membersonline.entry[0].$.key] = {
        count: membersonline.entry[0]._
      };
      onlineInfo[membersonline.entry[1].$.key] = {
        count: membersonline.entry[1]._
      };
      onlineInfo[membersonline.entry[2].$.key] = {
        count: membersonline.entry[2]._
      };
      return onlineInfo[membersonline.entry[4].$.key] = {
        count: membersonline.entry[4]._
      };
    });

    // Team Members
    return request('http://www.easportsworld.com/p/easw/a/easwclub/s/gs/blaze/401A0001/clubs/getMembers?clid=224&ofrc=0&mxrc=100', function (err, response, sBody) {

      parseString(sBody, {trim: true}, function (err, xml) {
        var teamlist = xml.getmembers.clubmemberlist[0].clubmember;
        for (var i in teamlist) {
          for (var x in onlineInfo) {
            if (!onlineInfo[x]['members']) {
              onlineInfo[x]['members'] = [];
              onlineInfo[x]['title'] = x.humanize();
            }
            if (teamlist[i].onlinestatus[0] == x) {
              onlineInfo[x]['members'].push(teamlist[i].persona[0])
            }
          }
        }
      });

      return res.render('online', {
        title: 'Online Team Status',
        membersOnline: onlineInfo
      });
    });
  });
}