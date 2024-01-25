const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

// Configuração da conexão com o banco de dados
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Substitua pelo seu usuário do MySQL
    password: 'root', // Substitua pela sua senha do MySQL
    database: 'myDatabase', // Substitua pelo nome do seu banco de dados
});
app.use(express.json());

// Middleware para fazer a conexão disponível em todas as rotas
app.use((req, res, next) => {
    req.mysql = pool;
    next();
});

// Rotas para manipular as tabelas categories e items
app.get('/categories', async (req, res) => {
    const [rows] = await req.mysql.query('SELECT * FROM categories');
    res.json(rows);
});

app.get('/items', async (req, res) => {
    const { date } = req.query;
    let query = 'SELECT * FROM items';

    if (date) {
        query += ` WHERE date_added = '${date}'`;
    }

    try {
        const [rows] = await req.mysql.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/items/:id', async (req, res) => {
    const itemId = req.params.id;

    try {
        const [rows] = await req.mysql.query(
            'SELECT * FROM items WHERE id = ?',
            [itemId],
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching item by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/categories/:id', async (req, res) => {
    const categoryId = req.params.id;

    try {
        const [rows] = await req.mysql.query(
            'SELECT * FROM categories WHERE id = ?',
            [categoryId],
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/categories', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    const [result] = await req.mysql.query(
        'INSERT INTO categories (name) VALUES (?)',
        [name],
    );
    res.json({ id: result.insertId, name });
});

app.post('/items', async (req, res) => {
    const { name, quantity, price, category_id } = req.body;
    if (!name || !quantity || !price || !category_id) {
        return res.status(400).json({
            error: 'Name, quantity, price, and category_id are required',
        });
    }
    const [result] = await req.mysql.query(
        'INSERT INTO items (name, quantity, price, category_id) VALUES (?, ?, ?, ?)',
        [name, quantity, price, category_id],
    );
    res.json({ id: result.insertId, name, quantity, price, category_id });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
