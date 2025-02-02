const express = require('express');
const bodyParser = require('body-parser');
const middlewares = require('./middlewares');
const cors = require('cors');
const api = require('./routes');
const fetch = require("node-fetch");
const { Headers } = require("node-fetch");
global.fetch = fetch;
global.Headers = Headers;

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

app.use(middlewares.setHeaders);

app.use('/github_api', api);

app.get('/', (req, res) => {
    res.send('Welcome to Github NodeJS API app!')
})

app.listen(PORT, () => console.log(`Server started on port ${PORT}...`))
