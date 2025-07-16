// Initialize MongoDB replica set
print('Starting replica set initialization');

// Configuration
const config = {
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb:27017" }
  ]
};

// Wait for MongoDB to be ready
let ready = false;
let retries = 30;
while (!ready && retries > 0) {
  try {
    print('Attempting to connect to MongoDB...');
    db.adminCommand({ ping: 1 });
    ready = true;
    print('Successfully connected to MongoDB');
  } catch (err) {
    print(`Connection failed, retrying... (${retries} attempts left)`);
    sleep(1000);
    retries--;
  }
}

if (!ready) {
  print('Failed to connect to MongoDB after multiple attempts');
  quit(1);
}

// Initialize replica set
try {
  print('Initializing replica set...');
  rs.initiate(config);
  print('Replica set initialized successfully');
} catch (err) {
  print('Error initializing replica set: ' + err);
  quit(1);
}
