import { initDb, seedData } from './db.js';

(async () => {
  await initDb();
  await seedData();
  console.log('Database ready with seed data');
  process.exit(0);
})();
