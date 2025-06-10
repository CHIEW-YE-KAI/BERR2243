require('dotenv').config();      

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// mount your routes
const itemsRouter = require('./routes/items');
app.use('/api/items', itemsRouter);


mongoose
  .connect(process.env.MONGO_URI)        
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    return app.listen(process.env.PORT);
  })
  .then(server => {
    const addr = server.address();
    console.log(`🚀 Server listening on http://localhost:${addr.port}`);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
