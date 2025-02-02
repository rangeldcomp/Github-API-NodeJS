const express = require('express');
const controllers = require('./controllers');

const router = express.Router();

router.get('/repo/:user/:reponame', controllers.getRepo)
router.get('/analyze', controllers.getAnalyze)

module.exports = router;