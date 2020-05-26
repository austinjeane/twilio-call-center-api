const express = require('express');
require('express-async-errors');
const app = express();
const port = 3000;

var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_SERVER_URI, {useNewUrlParser: true});

const userRoutes = require('./routes/callcenter.js');
const webhookRoutes = require('./routes/webhook.js');

app.use(express.urlencoded());
app.use(express.json());

app.use('/callcenter', userRoutes);
app.use('/webhook', webhookRoutes);

app.use((error, req, res, next) => {
    console.log("ERROR: ")
    console.log(error);
    res.status(500).json(error);
});

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

module.exports = app;