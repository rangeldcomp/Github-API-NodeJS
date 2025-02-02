require("dotenv").config();
const https = require('https');
const { generateOptions } = require('./utils');
const { insertIssue, insertComment, getIssuesWithComments, updateIssue } = require('./db'); // Importa funções de inserção no banco
const { preProcessing, analyzeIssues } = require('./gemini'); // Importa funções de tratamento por IA

const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (err) => reject(err));
    });
};

const getRepo = async function (req, res) {
    const user = req.params.user;
    const reponame = req.params.reponame;
    // Define limite para requisições a GEMINI
    let requestCount = 0;
    const rateLimit = 10; // requisições por minuto (ajuste conforme necessário)

    const options = generateOptions(`/repos/${user}/${reponame}/issues?state=closed&labels=confirmed-bug&page=${11}&per_page=30`);
    https.get(options, async function (apiResponse) {
        let data = '';

        apiResponse.on('data', (chunk) => {
            data += chunk;
        });

        apiResponse.on('end', async () => {
            try {
                const issues = JSON.parse(data);

                for (const issue of issues) {

                    if (requestCount >= rateLimit) {
                        console.log("Limite de taxa atingido. Esperando...");
                        await new Promise(resolve => setTimeout(resolve, 120000));
                        requestCount = 0; // Reinicia a contagem depois de 60 segundos
                    }

                    // Realiza o pré processamento do conteudo do body
                    const bodyProcessed = await preProcessing(issue.body);
                    requestCount++;
                    // Insere a issue e recupera o ID gerado
                    const issueId = await insertIssue({ ...issue, bodyProcessed: bodyProcessed });

                    // Obtém os comentários da issue
                    const comments_url = generateOptions(`/repos/${user}/${reponame}/issues/${issue.number}/comments`);

                    const comments = await fetchData(comments_url);

                    // Insere os comentários no banco
                    for (const comment of comments) {
                        if (requestCount >= rateLimit) {
                            console.log("Limite de taxa atingido. Esperando...");
                            await new Promise(resolve => setTimeout(resolve, 120000));
                            requestCount = 0;
                        }
                        // Realiza o pré processamento do conteudo do body
                        const commentProcessed = await preProcessing(comment.body);
                        requestCount++;
                        console.log('processou', requestCount)
                        // Insere os comentários da issue
                        await insertComment(issueId, { ...comment, commentProcessed: commentProcessed }); // Relaciona com a issue
                    }
                }

                res.status(200).send({ message: 'Issues e comentários inseridos com sucesso!' });
            } catch (error) {
                console.error('Erro ao processar ou inserir dados:', error);
                res.status(500).send('Erro ao processar dados ou inserir no banco.');
            }
        });
    }).on('error', (e) => {
        console.log(e);
        res.status(500).send('Erro ao conectar à API.');
    });
};

const getAnalyze = async function (req, res) {
    const issues = await getIssuesWithComments();

    let requestCount = 0;
    const rateLimit = 13; // requisições por minuto (ajuste conforme necessário)

    for (const issue of issues) {
        console.log(`Issue analisada`, issue.id)
        console.log(`processou`, requestCount)

        if (requestCount >= rateLimit) {
            console.log("Limite de taxa atingido. Esperando...");
            await new Promise(resolve => setTimeout(resolve, 80000));
            requestCount = 0; // Reinicia a contagem depois de 60 segundos
        }

        const issueAnalysis = await analyzeIssues(issue);
        console.log('classification',issueAnalysis.classification)
        requestCount++;
        
        await updateIssue({
            id: issue.id,
            classification: issueAnalysis.classification,
            evidence: issueAnalysis.evidence
        });


    }

    res.status(200).send({ message: 'Análise realizada com sucesso' });
}



module.exports = { getRepo, getAnalyze }