const { generateOptions } = require('./utils');
const https = require('https');

const getEmojis = async function (req, res) {
    const user = req.params.user;
    const options = generateOptions('/emojis')

    https.get(options, function (apiResponse) {
        apiResponse.pipe(res);
    }).on('error', (e) => {
        console.log(e);
        res.status(500).send(constants.error_message);
    })
}

const getUser = async function (req, res) {
    const user = req.params.user;
    const options = generateOptions('/users/' + user)

    https.get(options, function (apiResponse) {
        apiResponse.pipe(res);
    }).on('error', (e) => {
        console.log(e);
        res.status(500).send(constants.error_message);
    })
}

const getRepo = async function (req, res) {
    const user = req.params.user;
    const reponame = req.params.reponame;
    const options = generateOptions(`/repos/${user}/${reponame}/issues?state=closed&labels=confirmed-bug`)

    https.get(options, function (apiResponse) {
        apiResponse.pipe(res);
    }).on('error', (e) => {
        console.log(e);
        res.status(500).send(constants.error_message);
    })
}

const getCommit = async function (req, res) {
    const user = req.params.user;
    const reponame = req.params.reponame;
    const options = generateOptions('/repos/' + user + '/' + reponame + '/commits')

    https.get(options, function (apiResponse) {
        apiResponse.pipe(res);
    }).on('error', (e) => {
        console.log(e);
        res.status(500).send(constants.error_message);
    })
}

module.exports = { getUser, getRepo, getCommit, getEmojis }