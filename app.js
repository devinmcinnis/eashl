var express  = require('express')
  , routes   = require('./routes')
  , http     = require('http')
  , path     = require('path')
  , request  = require('request')
  , routes   = require('./routes')
  , fs       = require('fs')
  , cronJob  = require('cron').CronJob
  , orm      = require('orm')
  , pg       = require('pg')
  , cheerio  = require('cheerio')
  , app      = express()
  , api_env  = app.get('env')
  , configs  = require('./config')(api_env);

app.use(orm.express(configs.postgres.url, {
    define: function (db, models) {
      var cb = function(err, item) {
        if (err) { console.log(err); }
        if (item) { console.log(item); }
      }

      return db.load('models/models', function (err, item) {
        cb(err, item);

        var Oldstats  = db.models.oldstats;
        var Record    = db.models.records;

        // If "oldstats" table has nothing inside of it, get the current total stats for every player
        Oldstats.find({}, function (err, count) {
          cb(err, item);
          if (count.length < 1) {
            routes.fillStats();
          }
        });

        Record.find({team_id: 224}, function (err, exists) {
          if (exists.length < 1) {

            return Record.create([{
              team_id: 224,
              name: 'Puck Goes First',
              wins: 0,
              losses: 0,
              otl: 0,
              last_game: (new Date).toGMTString()
            }], function (err, team) {
              db.close();
            });

          }
        });

      });
    }
}));

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// var bloop = new Date();
// bloop.setSeconds(bloop.getSeconds() + 2);

new cronJob(configs.timer, function(){
// new cronJob(bloop, function(){

  console.log('Checking to see if team has played a game..');

  var lastGameTime = 'http://www.easportsworld.com/p/easw/a/easwclub/s/gs/blaze/401A0001/clubs/findClubs?cfli%7C=1&cfli%7C0=224&clti=1&mxrc=1';

  request({uri: lastGameTime}, function (err, response, timeBody) {
    if ( err && response.statusCode != 200 ) {console.log('Request error.');}

    parseString(timeBody, {trim: true}, function (err, timeXML) {

      function convertTime(time) {
        var theDate = new Date(time * 1000);
        return theDate;
      }

      var time = convertTime(timeXML.findclubs.clublist[0].club[0].clubinfo[0].lastgametime[0]);

      return orm.connect(configs.postgres.url, function(err, db) {
        return db.load('./models/models', function (err) {
          if (err) console.log(err);

          var Record = db.models.records;

          return Record.find({team_id: 224}, ['last_game', 'Z'], 1, function (err, lastGame) {
            console.log(lastGame[0].last_game.toString(), time.toString())
            if (lastGame.length > 0 && lastGame[0].last_game.toString() === time.toString()) {
              console.log(lastGame[0]);
              return console.log('Team has not played a game since ' + time);
            } else {
              console.log(lastGame[0].name + ' played a game at ' + time);
              console.log('Current record: '+lastGame[0].wins+'-'+lastGame[0].losses+'-'+lastGame[0].otl);
              return routes.getLatestGame();
            }
          });
        });
      });
    });
  });

  return request({uri: 'http://eashl.herokuapp.com'}, function () {});
}, null, true);

app.get('/', routes.index);

app.get('/player/:id', routes.player);

app.get('/filloldstatsbecauseifuckedsomethingup', routes.fillStats);

app.get('/whosonline', routes.whosOnline);

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
