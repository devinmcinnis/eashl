var stats  = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/members-list',
    games  = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/match-results?type=all',
    game_id = '';

var request = require('request')
  , jsdom = require('jsdom')
  , orm      = require('orm')
  , connectionString  = process.env.DATABASE_URL || 'postgres://eashl:eashl@localhost/eashl';
  
exports.index = function(req, res){
  res.render('index', { title: 'EASHL PGF Stat Logger' });
};

exports.getLatestGame = function (req, res) {

  var self = this,
      game_players = [];
      self.team = {};

  console.log('Searching easportsworld.com for the ID of the most recent game played...');
  console.log('This may take a minute or so.');
  
  request({uri: games}, function (err, response, body) {
    // Basic error check
    if ( err && response.statusCode != 200 ) {console.log('Request error.')}
    // Send the body parameter as the HTML code we will parse in jsdom
    // Also, tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
    jsdom.env({
      html: body,
      scripts: ['http://code.jquery.com/jquery-1.6.min.js']
    },
    function (err, window) {
    
      var $ = window.jQuery,
      $body = $('body #widgets > table > tbody > tr:first-child');
      gameId = $body.find('.match-details-button').attr('rel');

      self.gameId = gameId;

      return getPlayersOfLastGame();

    });
  });

  function getPlayersOfLastGame() {
    var game = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/match-results/details?match_id='+ self.gameId + '&type=all';

    console.log('Getting a list of the players that played in the last game...');

    // Tell the request that we want to fetch eashl.com, send the restuls to a function
    request({uri: game}, function (err, response, body) {
      // Basic error check
      if ( err && response.statusCode != 200 ) {console.log('Request error.')}
      // Send the body parameter as the HTML code we will parse in jsdom
      // Also, tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
      jsdom.env({
        html: body,
        scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      },
      function (err, window) {
        // Use jQuery just as in regular HTML
        var $ = window.jQuery,
        $body = $('body'),
        players = $body.find('.yui-u.first tr > th > div > a');
        // console.log(players);
        players.each(function() {
          game_players.push($(this).text());
        });

        return getPlayerStatsOfLastGame();
      });
    });
  }

  function getPlayerStatsOfLastGame() {

    console.log('Getting the stats of the players in the last game...');

    // Tell the request that we want to fetch eashl.com, send the restuls to a function
    request({uri: stats}, function (err, response, body) {
      // Basic error check
      if ( err && response.statusCode != 200 ) {console.log('Request error.')}
      // Send the body parameter as the HTML code we will parse in jsdom
      // Also, tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
      jsdom.env({
        html: body,
        scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      },
      function (err, window) {
        // Use jQuery just as in regular HTML
        var $ = window.jQuery,
        $body = $('body'),
        $player = $body.find('tbody tr'),
        $category = $player.find('td');

        $player.each(function (i, row) {
          var $row = $(row);
          var playername = $(row).find('td:nth-child(2) a').text();
         
          game_players.map(function (callback, key) {
            if (game_players[key] == playername) {
              self.team[playername] = {};

              $category.each(function (i, stat) {
                var statname = $row.find(stat).attr('title');
                var $stat = $row.find(stat);
                if ( $stat.index() > 2 ) {
                  statname = statname.toLowerCase().replace(/[^0-9a-z-]/g,"");
                  self.team[playername][statname] = $stat.text();
                }
              });
            }
          });
        });

        getGameInfoOfLastGame();
      });
    });
  }

  function getGameInfoOfLastGame() {

    console.log('Getting game information of the most recent game played...');

    request({uri: games}, function (err, response, body) {
      // Basic error check
      if ( err && response.statusCode != 200 ) {console.log('Request error.')}
      // Send the body parameter as the HTML code we will parse in jsdom
      // Also, tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
      jsdom.env({
        html: body,
        scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      },
      function (err, window) {
      
        var $ = window.jQuery,
        $body = $('#widgets thead + tbody > tr:first-child'),
        $opp = $body.find('.align-right.team'),
        game_score = $body.find('match-result-score').text().split('-'),
        date = $body.find('.align-center.strong div:last-child').text().split(' ');
        var time = date[1].split(':'),
        hours = (date[2] === 'PM') ? time[0] : time[0] + 12;

        self.date = new Date();
        self.date.setHours(hours);
        self.date.setMinutes(time[1]);
        self.date.setSeconds('00');

        var reg = /^[a-z0-9]+$/gmi;
        self.opp = {
          name: $opp.find('a').text(),
          url: $opp.find('a').attr('href')
        }
        $opp.find('a').remove();
        self.opp['abbr'] = $opp.find('div').text().replace(/\W/g, '');

        logResults();
      });
    }); 
  }

  function logResults() {
    // console.log('Results of the last game played:')
    // console.log(self);

    orm.connect(connectionString, function(err, db) {
      db.load('./models/models', function (err) {
        if (err) console.log(err);

        var oldstat = db.models.oldstats;
        var newstat = db.models.stats;

        for (var player in self.team) {
          oldstat.find({name: player}, function (err, person) {
            
            var newPlayerStat = {
              name: person[0].name
            };

            for (var stat in self.team[player]) {
              newPlayerStat[stat] = self.team[person[0].name][stat] - person[0][stat];
            }

            newPlayerStat.shootingpercentage = (newPlayerStat.goals === 0) ? 0 : ((newPlayerStat.goals / newPlayerStat.shots) * 100).toFixed(2);

            newPlayerStat.savepercentage = (newPlayerStat.savepercentage === 0) ? 0 : (((newPlayerStat.totalgoalsagainst + newPlayerStat.saves) / newPlayerStat.shots)).toFixed(3);

            newPlayerStat['date_played'] = self.date + '';

            newstat.create([newPlayerStat], function (err, item) {
              console.log(err);
              console.log(item);
            });
            
            newPlayerStat = {};

          });
        }
      });
    });
    console.log('Complete');
  }

};

exports.fillStats = function (req, res) {

  var self = this;
      self.team = {};

  request({uri: stats}, function (err, response, body) {
    // Basic error check
    if ( err && response.statusCode != 200 ) {console.log('Request error.')}
    // Send the body parameter as the HTML code we will parse in jsdom
    // Also, tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
    jsdom.env({
      html: body,
      scripts: ['http://code.jquery.com/jquery-1.6.min.js']
    },
    function (err, window) {
      // Use jQuery just as in regular HTML
      var $ = window.jQuery,
      $body = $('body'),
      $player = $body.find('tbody tr'),
      $category = $player.find('td');

      $player.each(function (i, row) {
        var $row = $(row);
        var playername = $(row).find('td:nth-child(2) a').text();

        self.team[playername] = {};

        $category.each(function (i, stat) {
          var statname = $row.find(stat).attr('title');
          var $stat = $row.find(stat);
          if ( $stat.index() > 2 ) {
            statname = statname.toLowerCase().replace(/[^0-9a-z-]/g,"");
            self.team[playername][statname] = $stat.text();
          }
        });
      });

      orm.connect(connectionString, function(err, db) {
        db.load('./models/models', function (err) {
          if (err) console.log(err);
          
          var oldstat = db.models.oldstats;
          var playerObj = {};

          for (var player in self.team) {
            playerObj.name = player;
            for (var stat in self.team[player]) {
              statname = stat.toLowerCase().replace(/[^0-9a-z-]/g,"");
              playerObj[statname] = parseFloat(self.team[player][stat], 10);
            }
            oldstat.create([playerObj], function (err, item) {
              console.log(item);
            });
            playerObj = {};
          }
        });
      });
    });
  });
}