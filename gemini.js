const { GoogleGenerativeAI } = require("@google/generative-ai");
const { formatToJson } = require('./utils');

const preProcessing = async (textToProcessed) => {
    const gemini_api_key = process.env.API_KEY;
    const googleAI = new GoogleGenerativeAI(gemini_api_key);
    const model = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
        const prompt = `
        Realize o pré-processamento do texto abaixo para prepará-lo para classificação de issue. Realize as seguintes etapas:
            1. Remova ruídos, como urls, tags html e caracteres especiais.
            2. Padronize as palavras, removendo plural, conjugações, etc.
            3. Remova as palavras que não agregam valor para a classificação (stop words).

        Texto a ser pré-processado:
        ${textToProcessed}

        Retorne o texto resultante, separado por espaços.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.log("response error", error);
    }
};

const analyzeIssues = async (issue) => {
    const gemini_api_key = process.env.API_KEY;
    const googleAI = new GoogleGenerativeAI(gemini_api_key);
    const model = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const jsonString = JSON.stringify(issue);

    try {
        const prompt = `
        Analise o seguinte dado no formato JSON, representa uma issue com título, corpo e comentários.
        Retorne uma classificação das categorias 'Refatoração', 'Testes de Regressão', 'Ambos' ou 'Nenhum', só podendo ser uma
        dessas categorias. Não colocoque outra classificação alem das definidas 'Refatoração', 'Testes de Regressão', 'Ambos' ou 'Nenhum'.

        Texto a ser pré-processado:
        ${jsonString}

        Retorne a classificação no seguinte formato de  texto {"classification": string, "evidence": string },
        sendo evidence um texto explicando o motivo da classificação`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return formatToJson(response.text());
    } catch (error) {
        console.log("response error", error);
    }
};

// const generate = async (prompt) => {
//     try {
//         const result = await geminiModel.generateContent(prompt);
//         const response = result.response;
//         console.log('Resposta gerada com sucesso');
//         return response;
//     } catch (error) {
//         console.log("response error", error);
//     }
// };

// async function run() {

//     const model = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     const chat = model.startChat({
//         history: [
//             {
//                 role: "user",
//                 parts: [{ text: "Hello, I have 2 dogs in my house." }],
//             }
//         ],
//         generationConfig: {
//             maxOutputTokens: 100,
//         },
//     });

//     const msg = "How many paws are in my house?";

//     const result = await chat.sendMessage(msg);
//     const response = await result.response;
//     const text = response.text();
//     console.log(text);
// }

module.exports = { preProcessing, analyzeIssues }