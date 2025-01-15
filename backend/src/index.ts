import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db from './services/database.s';
import { CartModel, UsersModel } from './models/users.m';
import jwt from './services/jwt.s';
import dotenv from 'dotenv';
import { AuthMiddleWare } from './services/auth.middle.s';
import PasswordSecurity from './services/PasswordSecurity.s';
dotenv.config();
new db();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

app.post('/api/user/register', async (req: any, res: any) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send('Username and password are required');
        return;
    }
    const hashedPassword = await PasswordSecurity.hash(password);
    const conn = await db.getConnection();
    await conn.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]).catch(() => {
        res.status(400).send('User already exists');
        return
    })
    if (res.headersSent) {
        return;
    }
    const user = await conn.query('SELECT * FROM users WHERE username = ?', [username]).then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    const generatedJwt = jwt.issue({ id: user[0].id });
    res.cookie('Authorization', generatedJwt.accessToken, { httpOnly: true });
    res.send('User registered');
});

app.post('/api/user/login', async (req: any, res: any) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send('Username and password are required');
        return;
    }
    const conn = await db.getConnection();
    const users = await conn.query('SELECT * FROM users WHERE username = ?', [username]).then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    if (users.length === 0) {
        res.status(401).send('Invalid username or password');
        return;
    }
    const user = users[0];
    const passwordMatch = await PasswordSecurity.compare(password, user.password);
    if (!passwordMatch) {
        res.status(401).send('Invalid username or password');
        return;
    }
    const generatedJwt = jwt.issue({ id: user.id });
    res.cookie('Authorization', generatedJwt.accessToken, { httpOnly: true });
    res.send('Logged in');
});

app.get('/api/user/logout', async (req: any, res: any) => {
    res.clearCookie('Authorization');
    res.send('Logged out');
});

app.get('/api/user/data', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const cart: any[] = await db.getConnection().then((conn) => {
        return conn.query('SELECT i.name, i.image, i.description, i.price FROM cart c JOIN products i ON c.item_id = i.id WHERE c.user_id = ?', [user.id]);
    }).then((result) => {
        return result[0];
    }).catch(() => {
        return [];
    }) as any[]
    const items = cart.map((cartItem) => {
        return {
            ...cartItem,
            quantity: cart.filter((item) => item.item_id === cartItem.item_id).length
        }
    }).filter((item, index, self) => {
        return self.findIndex((t) => t.item_id === item.item_id) === index;
    });
    res.send({
        ...user,
        password: undefined,
        cart
    });
});

app.get('/api/user/cart/add', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const { item_id } = req.query;
    if (!item_id) {
        res.status(400).send('Item ID is required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('INSERT INTO cart (user_id, item_id) VALUES (?, ?)', [user.id, item_id]);
    res.send('Item added to cart');
});

app.get('/api/user/cart/remove', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const { item_id } = req.query;
    if (!item_id) {
        res.status(400).send('Item ID is required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('DELETE FROM cart WHERE user_id = ? AND item_id = ? LIMIT 1', [user.id, item_id]);
    res.send('Item removed from cart');
});

app.get('/api/user/cart/clear', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const conn = await db.getConnection();
    await conn.query('DELETE FROM cart WHERE user_id = ?', [user.id]);
    res.send('Cart cleared');
});

app.get('/api/products', async (req: any, res: any) => {
    const conn = await db.getConnection();
    const items = await conn.query('SELECT * FROM products').then((result) => {
        return result[0] as CartModel[];
    }).catch(() => {
        return [];
    });
    res.send(items);
});

app.get('/api/admin/users', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Forbidden');
        return;
    }
    const conn = await db.getConnection();
    const users = await conn.query('SELECT * FROM users').then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    res.send(users);
});

app.post('/api/admin/user/:id/promote', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Forbidden');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID is required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('UPDATE users SET role = "admin" WHERE id = ?', [id]);
    res.send('User promoted');
});

app.post('/api/admin/user/:id/demote', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Forbidden');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID is required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('UPDATE users SET role = "user" WHERE id = ?', [id]);
    res.send('User demoted');
});

app.get('/api/admin/user/:id/delete', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Forbidden');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID is required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('DELETE FROM users WHERE id = ?', [id]);
    res.send('User deleted');
});

app.post('/api/admin/products', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Forbidden');
        return;
    }
    const { name, price, description, image } = req.body;
    if (!name || !price || !description || !image) {
        res.status(400).send('Name, price, description, and image are required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)', [name, price, description, image]);
    res.send('Product added');
});

app.patch('/api/admin/product/:id', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Forbidden');
        return;
    }
    const { id } = req.params;
    const { name, price, description, image } = req.body;
    if (!id || !name || !price || !description || !image) {
        res.status(400).send('ID, name, price, description, and image are required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('UPDATE products SET name = ?, price = ?, description = ?, image = ? WHERE id = ?', [name, price, description, image, id]);
    res.send('Product updated');
});

app.delete('/api/admin/product/:id', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Forbidden');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID is required');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('DELETE FROM products WHERE id = ?', [id]);
    res.send('Product deleted');
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});