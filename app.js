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
      return db.load('models/models', function (err, item) {
        if (err) { return console.log(err); }

        var Oldstats  = db.models.oldstats;
        var Record    = db.models.records;

        // If "oldstats" table has nothing inside of it, get the current total stats for every player
        return Oldstats.find({}, function (err, count) {
          if (err) { return console.log(err); }
          if (count.length < 1) {
            return routes.fillStats();
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
// new cronJob("0 */2 * * * *", function(){

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

          return Record.find({team_id: 224}, ['date', 'Z'], 1, function (err, lastGame) {
            if (lastGame.length > 0 && lastGame[0].date.toString() === time.toString()) {
              return console.log('Team has not played a game since ' + time);
            } else if (lastGame.length > 0) {
              console.log(lastGame[0].name + ' played a game at ' + time);
              console.log('Current record: '+lastGame[0].wins+'-'+lastGame[0].losses+'-'+lastGame[0].otl);
              return routes.getLatestGame();
            } else {
              console.log('No record found; creating new record.')
              return routes.updateRecord(timeXML.findclubs.clublist[0].club[0].clubinfo[0].lastgametime[0]);
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

app.get('/getmissedstats', routes.getLatestGame);

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
