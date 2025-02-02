const constants = require('./constants');

const generateOptions = (_path) => {
    return options = {
        hostname: constants.hostname,
        path: _path,
        headers: {
            'User-Agent': constants.user_agent
        },
        OAUth: process.env.GITHUB_ACCESS_TOKEN
    }
}

const calculateResolutionTime = (createdAt, closedAt) => {
    const createdDate = new Date(createdAt);
    const closedDate = new Date(closedAt);

    // Calcula a diferença em milissegundos
    const diffInMs = closedDate - createdDate;

    // Converte de milissegundos para dias
    return Math.round(diffInMs / (1000 * 3600 * 24));  // Arredonda para baixo
}

const formatToJson = (text) => {
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText)
}

module.exports = { generateOptions, calculateResolutionTime, formatToJson }