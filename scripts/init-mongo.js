// MongoDB initialization script
db = db.getSiblingDB('agentvoice');

// Create collections
db.createCollection('users');
db.createCollection('contacts');
db.createCollection('campaigns');
db.createCollection('crm_integrations');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.contacts.createIndex({ "email": 1 });
db.contacts.createIndex({ "phone": 1 });
db.contacts.createIndex({ "user_id": 1 });
db.campaigns.createIndex({ "user_id": 1 });
db.campaigns.createIndex({ "status": 1 });

print('MongoDB initialized successfully!'); 