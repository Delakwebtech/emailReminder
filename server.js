const express = require('express');
const bodyParser = require('body-parser');

// Route files
const reminder = require('./routes/reminder');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Mount routers
app.use('/reminders', reminder);


app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});