module.exports = function (db, cb) {
  db.define("teams", {
    team_id     : Number,
    name        : String,
    abbr        : String
  }).sync();

  db.define("records", {
    team_id     : Number,
    name        : String,
    wins        : Number,
    losses      : Number,
    otl         : Number,
    date        : Date
  }).sync();

  db.define("players", {
    name        : String
  }).sync();

  db.define("games", {
    game_id     : String,
    team1_id    : Number,
    team1_name  : String,
    team1_abbr  : String,
    team1_score : Number,
    team2_id    : Number,
    team2_name  : String,
    team2_abbr  : String,
    team2_score : Number,
    date        : Date
  }).sync();

  db.define("stats", {
    name              : String,
    date_played       : Date,
    game_id           : Number,
    goals             : Number,
    assists           : Number,
    points            : Number,
    plusminus         : Number,
    penaltyminutes    : Number,
    powerplaygoals    : Number,
    shorthandedgoals  : Number,
    totalnumberofhits : Number,
    blockedshots      : Number,
    shots             : Number,
    shootingpercentage: Number,
    goalsagainstaverage : Number,
    totalgoalsagainst : Number,
    saves             : Number,
    savepercentage    : Number,
    shutouts          : Number
  }).sync();

  db.define("oldstats", {
    name              : String,
    goals             : Number,
    assists           : Number,
    points            : Number,
    plusminus         : Number,
    penaltyminutes    : Number,
    powerplaygoals    : Number,
    shorthandedgoals  : Number,
    totalnumberofhits : Number,
    blockedshots      : Number,
    shots             : Number,
    shootingpercentage: Number,
    goalsagainstaverage : Number,
    totalgoalsagainst : Number,
    saves             : Number,
    savepercentage    : Number,
    shutouts          : Number
  }).sync();

  return cb();
}