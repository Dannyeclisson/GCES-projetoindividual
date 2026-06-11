var Pool = require('pg').Pool;

var pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL
} : {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || 'mkjs',
  user: process.env.POSTGRES_USER || 'mkjs',
  password: process.env.POSTGRES_PASSWORD || 'mkjs'
});

var initialized = false;
var initializing = false;

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function createEventsTable() {
  return pool.query(
    "CREATE TABLE IF NOT EXISTS game_events (" +
      "id SERIAL PRIMARY KEY, " +
      "event_type VARCHAR(64) NOT NULL, " +
      "payload JSONB NOT NULL DEFAULT '{}'::jsonb, " +
      "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()" +
    ")"
  );
}

async function initDatabase() {
  var attempt;

  if (initialized || initializing) {
    return;
  }

  initializing = true;

  for (attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await createEventsTable();
      initialized = true;
      console.log('Postgres persistence ready.');
      return;
    } catch (error) {
      console.warn('Postgres init attempt ' + attempt + ' failed: ' + error.message);
      if (attempt < 10) {
        await wait(2000);
      }
    }
  }

  console.warn('Postgres persistence disabled for this run.');
}

async function logEvent(eventType, payload) {
  if (!initialized) {
    return false;
  }

  try {
    await pool.query(
      'INSERT INTO game_events (event_type, payload) VALUES ($1, $2::jsonb)',
      [eventType, JSON.stringify(payload || {})]
    );
    return true;
  } catch (error) {
    console.warn('Could not persist event ' + eventType + ': ' + error.message);
    return false;
  }
}

async function listRecentEvents(limit) {
  var result;

  if (!initialized) {
    return [];
  }

  result = await pool.query(
    "SELECT id, event_type, payload, created_at FROM game_events " +
      "WHERE event_type IN ('game_created', 'game_joined') " +
      "ORDER BY created_at DESC, id DESC LIMIT $1",
    [limit || 20]
  );

  return result.rows;
}

module.exports = {
  initDatabase: initDatabase,
  logEvent: logEvent,
  listRecentEvents: listRecentEvents
};
