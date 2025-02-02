
const { calculateResolutionTime } = require('./utils');

async function connect() {
    if (global.connection)
        return global.connection.connect();

    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.CONNECTION_STRING
    });

    //apenas testando a conexão
    const client = await pool.connect();
    console.log("Criou pool de conexões no PostgreSQL!");

    const res = await client.query('SELECT NOW()');
    console.log(res.rows[0]);
    client.release();

    //guardando para usar sempre o mesmo
    global.connection = pool;
    return pool.connect();
}

async function insertIssue(issue) {
    const resolutionTime = calculateResolutionTime(issue.created_at, issue.closed_at);
    const labels = issue.labels.map(label => label?.name);
    const client = await connect();

    const query = `        
        INSERT INTO issues (issue_number, created_at, closed_at, updated_at, title, body, state, author_login, author_id, html_url, comments_count,
        pull_request_url, issue_resolution_time, classification, labels, body_processed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
    `;

    const values = [
        issue.number,
        issue.created_at,
        issue.closed_at,
        issue.updated_at,
        issue.title,
        issue.body,
        issue.state,
        issue.user.login,
        issue.user.id,
        issue.html_url,
        issue.comments,
        issue?.pull_request?.url || null,
        resolutionTime,
        issue.classification || null,
        labels,
        issue.bodyProcessed
    ];

    try {
        const res = await client.query(query, values);
        return res.rows[0].id; // Retorna o ID gerado
    } catch (error) {
        console.error('Erro ao inserir issue no banco :', error);
        throw error; // Lança o erro para ser tratado no controller
    } finally {
        client.release();
    }
}

async function insertComment(issueId, comment) {
    const client = await connect();

    const query = `
        INSERT INTO comments (issue_id, comment_body, commenter_login, commenter_id, created_at, comment_body_processed)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [
        issueId,
        comment.body,
        comment.user.login,
        comment.user.id,
        comment.created_at,
        comment.commentProcessed
    ];

    try {
        await client.query(query, values);
    } catch (error) {
        console.error('Erro ao inserir comentário no banco:', error);
    } finally {
        client.release();
    }
}

async function getIssuesWithComments() {
    const client = await connect();
    try {
        const issuesQuery = `SELECT id, title, body_processed, body FROM public.issues
            WHERE (classification IS NULL OR classification = '') AND (evidence IS NULL OR evidence = '');`;
            
        const commentsQuery = `SELECT issue_id, comment_body_processed, comment_body FROM public.comments;`;

        // Executar as consultas
        const issuesResult = await client.query(issuesQuery);
        const commentsResult = await client.query(commentsQuery);

        // Mapear comentários por issue_id
        const commentsByIssue = commentsResult.rows.reduce((acc, comment) => {
            const { issue_id, comment_body_processed, comment_body } = comment;
            if (!acc[issue_id]) acc[issue_id] = [];
            acc[issue_id].push(comment_body_processed ?? comment_body);
            return acc;
        }, {});

        // Montar o resultado final
        const issuesWithComments = issuesResult.rows.map(issue => ({
            id: issue.id,
            title: issue.title,
            body: issue.body_processed ?? issue.body,
            comments: commentsByIssue[issue.id] || [],
        }));

        return issuesWithComments;
    } catch (error) {
        console.error('Erro ao buscar issues e comentários:', error);
        throw error;
    }
}

async function updateIssue(issue) {

    const client = await connect();

    const query = `
        UPDATE issues
        SET
            classification = $1,
            evidence = $2
        WHERE id = $3
        RETURNING id
    `;

    const values = [
        issue.classification,
        issue.evidence,
        issue.id
    ];

    try {
        const res = await client.query(query, values);
        return res.rows[0]?.id || null; // Retorna o ID atualizado ou null se nenhuma linha for afetada
    } catch (error) {
        console.error('Erro ao atualizar issue no banco :', error);
        throw error; // Lança o erro para ser tratado no controller
    } finally {
        client.release();
    }
}


module.exports = { insertIssue, insertComment, getIssuesWithComments, updateIssue }