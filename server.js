/**
 * Fresh Bites Restaurant - Backend Server
 * Tech Stack: Node.js, Express, Socket.io, PostgreSQL
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

// --- Configuration ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Database Connection (Configure with your actual DB credentials)
const pool = new Pool({
    user: 'postgres',        // Default user
    host: 'localhost',
    database: 'restaurant_db',
    password: 'YOUR_PASSWORD', // ⚠️ Replace with your actual Postgres password
    port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/'))); // Serve static files

// --- Routes ---

// 1. GET /menu-items - Fetch all items
app.get('/api/menu-items', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menu_items ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 2. POST /order - Place a new order (Transaction + Socket Emit)
app.post('/api/order', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { customer_info, items, total_amount } = req.body;

        // A. Insert Order
        const orderQuery = `
            INSERT INTO orders (customer_info, total_amount, status)
            VALUES ($1, $2, 'pending')
            RETURNING id, created_at
        `;
        const orderResult = await client.query(orderQuery, [JSON.stringify(customer_info), total_amount]);
        const newOrderId = orderResult.rows[0].id;

        // B. Insert Details
        // items array expected to have: { id, quantity, price }
        for (const item of items) {
            const detailQuery = `
                INSERT INTO order_details (order_id, menu_item_id, quantity, unit_price)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(detailQuery, [newOrderId, item.id, item.quantity, item.price]);
        }

        await client.query('COMMIT');

        // C. Real-Time Notification
        const orderPayload = {
            id: newOrderId,
            customer_info,
            items,
            total_amount,
            status: 'pending',
            created_at: orderResult.rows[0].created_at
        };

        // Emit to 'kitchen' room or all clients
        io.emit('new_order', orderPayload);

        res.status(201).json({ success: true, orderId: newOrderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Transaction failed' });
    } finally {
        client.release();
    }
});

// 3. PUT /menu-item/:id - Update Price or Availability
app.put('/api/menu-item/:id', async (req, res) => {
    const { id } = req.params;
    const { price, is_available, name, description } = req.body;

    try {
        // Dynamic update query
        const query = `
            UPDATE menu_items 
            SET price = COALESCE($1, price),
                is_available = COALESCE($2, is_available),
                name = COALESCE($3, name),
                description = COALESCE($4, description),
                updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [price, is_available, name, description, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Notify clients if needed (optional)
        io.emit('menu_update', result.rows[0]);

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

// --- Socket.io Handlers ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
