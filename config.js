var obj = {
  id: 'eashl',
  postgres: {},
  timer: {}
};

module.exports = function(env) {
  if (env == 'development') {
    obj.postgres.url = "postgres://eashl:eashl@localhost/eashl";

    // Start cron job once, right away
    obj.timer = new Date();
    obj.timer.setSeconds(obj.timer.getSeconds() + 3);

  } else if (env == 'staging' || env == 'production') {
    obj.postgres.url = process.env.HEROKU_POSTGRESQL_TEAL_URL;

    // Don't start cron job right away but have it run every 20 minutes
    obj.timer = '0 */10 * * * *';
  }

  return obj;
}