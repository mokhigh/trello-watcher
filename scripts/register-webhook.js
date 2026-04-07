import 'dotenv/config';

const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_BOARD_ID, TRELLO_CALLBACK_URL } = process.env;

const missing = ['TRELLO_API_KEY', 'TRELLO_API_TOKEN', 'TRELLO_BOARD_ID', 'TRELLO_CALLBACK_URL']
  .filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`Registering webhook...`);
console.log(`  Board:    ${TRELLO_BOARD_ID}`);
console.log(`  Callback: ${TRELLO_CALLBACK_URL}`);

const url = new URL('https://api.trello.com/1/webhooks');
url.searchParams.set('key', TRELLO_API_KEY);
url.searchParams.set('token', TRELLO_API_TOKEN);

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    callbackURL: TRELLO_CALLBACK_URL,
    idModel: TRELLO_BOARD_ID,
    description: 'trello-watcher',
    active: true,
  }),
});

const body = await res.json();

if (!res.ok) {
  console.error(`Failed (${res.status}):`, body);
  process.exit(1);
}

console.log('\nWebhook registered successfully.');
console.log(`  ID:     ${body.id}`);
console.log(`  Active: ${body.active}`);
