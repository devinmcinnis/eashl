var stats  = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/members-list',
    games  = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/match-results?type=all',
    game_id = '';

var request = require('request')
  , jsdom = require('jsdom');
  
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

      self.team.gameId = gameId;

      return getPlayersOfLastGame();

    });
  });

  function getPlayersOfLastGame() {
    var game = 'http://www.easportsworld.com/en_US/clubs/partial/401A0001/224/match-results/details?match_id='+ self.team.gameId + '&type=all';

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
        $body = $('body #widgets > table > tbody > tr:first-child'),
        $opp = $body.find('.align-right.team'),
        game_score = $body.find('match-result-score').text().split('-'),
        date = $body.find('.score .strong').text().split(' '),
        time = date[1].split(':'),
        hours = (date[2] === 'PM') ? time[0] : time[0] + 12;

        self.team.date = new Date();
        self.team.date.setHours(hours);
        self.team.date.setMinutes(time[1]);
        self.team.date.setSeconds('00');

        var reg = /^[a-z0-9]+$/gmi;
        self.team.opp = {
          name: $opp.find('a').text(),
          url: $opp.find('a').attr('href')
        }
        $opp.find('a').remove();
        self.team.opp['abbr'] = $opp.find('div').text().replace(/\W/g, '');

        logResults();
      });
    }); 
  }

  function logResults() {
    console.log('Results of the last game played:')
    console.log(self.team);
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
            self.team[playername][statname] = $stat.text();
          }
        });
      });

      var playerArr = [];

      for (var player in self.team) {
        playerArr.push(player);
        for (var stat in self.team[player]) {
          playerArr.push(parseInt(self.team[player][stat], 10));
        }
        // console.log(playerArr)
        // client.query("INSERT INTO oldstats(player_id integer, goals integer, assists integer, points integer, plus_minus integer, pims integer, ppg integer, shg integer, total_hits integer, bs integer, shots integer, shooting_p integer, gaa integer, ga integer, saves integer, save_p integer, so integer) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)", playerArr);
        playerArr = [];
      }
    });
  });
}