const express = require('express');
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db from './services/database.s';
import { CartModel, ItemsModel, UsersModel } from './models/users.m';
import dotenv from 'dotenv';
import { AuthMiddleWare } from './services/auth.middle.s';
import PasswordSecurity from './services/PasswordSecurity.s';
import jwt from 'jsonwebtoken';
import Crypto from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';

// const catchErrors = ["unhandledRejection", "uncaughtException", "SIGINT", "SIGTERM", "SIGQUIT", "EOENT"];
// catchErrors.forEach((type) => {
//     process.on(type, (err) => {
//         console.error(`Error: ${err.message}`);
//         process.exit(1);
//     });
// });

dotenv.config();
new db();
const app = express();
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(bodyParser.json({
    limit: '100mb'
}));
app.use(cookieParser());

app.use((req: any, res: any, next: any) => {
    console.log(req.method + ' ' + req.url);
    next();
});

app.post('/api/user/register', async (req: any, res: any) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).send('Email a heslo jsou povinné');
        return;
    }
    const hashedPassword = await PasswordSecurity.hash(password);
    const conn = await db.getConnection();
    await conn.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]).catch((e) => {
        console.log(e);
        res.status(400).send('Uživatel již existuje');
        return
    })
    if (res.headersSent) {
        return console.log('Uživatel již existuje');
    }
    const user = await conn.query('SELECT * FROM users WHERE email = ?', [email]).then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    const generatedJwt = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET as string);
    res.cookie('Authorization', generatedJwt, { httpOnly: true });
    conn.release();
    res.send('Uživatel zaregistrován');
});

app.post('/api/user/login', async (req: any, res: any) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).send('Email a heslo jsou povinné');
        return;
    }
    const conn = await db.getConnection();
    const users = await conn.query('SELECT * FROM users WHERE email = ?', [email]).then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    if (users.length === 0) {
        res.status(401).send('Neplatný email nebo heslo');
        return;
    }
    const user = users[0];
    const passwordMatch = await PasswordSecurity.compare(password, user.password);
    if (!passwordMatch) {
        res.status(401).send('Neplatný email nebo heslo');
        return;
    }
    const generatedJwt = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string);
    res.cookie('Authorization', generatedJwt, { httpOnly: true });
    conn.release();
    res.send('Přihlášeno');
});

app.get('/api/user/logout', async (req: any, res: any) => {
    res.clearCookie('Authorization');
    res.send('Odhlášeno');
});

app.get('/api/user/data', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const cart: any[] = await db.getConnection().then((conn) => {
        const u = conn.query('SELECT i.id, i.name, i.image, i.description, i.price FROM cart c JOIN products i ON c.item_id = i.id WHERE c.user_id = ?', [user.id]);
        conn.release();
        return u;
    }).then((result) => {
        return result[0];
    }).catch(() => {
        return [];
    }) as any[]
    const items = cart.map((cartItem) => {
        return {
            ...cartItem,
            image: cartItem.image.startsWith('internal:') && existsSync(__dirname + cartItem.image.replace('internal:', '')) ? readFileSync(__dirname + cartItem.image.replace('internal:', '')).toString() : cartItem.image,
            quantity: cart.filter((item) => item.id === cartItem.id).length
        }
    }).filter((item, index, self) => {
        return self.findIndex((t) => t.id === item.id) === index;
    });
    res.send({
        ...user,
        password: undefined,
        items
    });
});

app.post('/api/user/cart/add', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const { item_id, quantity } = req.body;
    if (!item_id) {
        res.status(400).send('ID položky je povinné');
        return;
    }
    const conn = await db.getConnection();
    for (let i = 0; i < quantity; i++) {
        await conn.query('INSERT INTO cart (user_id, item_id) VALUES (?, ?)', [user.id, item_id]);
    }
    conn.release();
    res.send('Položka přidána do košíku');
});

app.post('/api/user/cart/remove', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const { item_id } = req.body;
    if (!item_id) {
        res.status(400).send('ID položky je povinné');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('DELETE FROM cart WHERE user_id = ? AND item_id = ? LIMIT 1', [user.id, item_id]);
    conn.release();
    res.send('Položka odstraněna z košíku');
});

app.get('/api/user/cart/clear', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    const conn = await db.getConnection();
    await conn.query('DELETE FROM cart WHERE user_id = ?', [user.id]);
    conn.release();
    res.send('Košík vyčištěn');
});

app.get('/api/products', async (req: any, res: any) => {
    const conn = await db.getConnection();
    let items = await conn.query('SELECT * FROM products').then((result) => {
        return result[0] as ItemsModel[];
    }).catch(() => {
        return [];
    });
    items = items.map((item) => {
        if (item.image.startsWith('internal:')) {
            item.image = existsSync(__dirname + item.image.replace('internal:', '')) ? readFileSync(__dirname + item.image.replace('internal:', '')).toString() : item.image;
        }
        return item;
    });
    conn.release();
    res.send(items);
});

app.get('/api/admin/users', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const conn = await db.getConnection();
    const users = await conn.query('SELECT * FROM users').then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    conn.release();
    res.send(users);
});

app.patch('/api/admin/user/:id/promote', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID je povinné');
        return;
    }
    const conn = await db.getConnection();
    const targetUser = await conn.query('SELECT * FROM users WHERE id = ?', [id]).then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    if (targetUser.length === 0) {
        res.status(404).send('Uživatel nenalezen');
        return;
    }
    if (targetUser[0].email === user.email) {
        res.status(400).send('Nemůžete povýšit sám sebe');
        return;
    }
    if (targetUser[0].email === 'admin@vysum.to') {
        res.status(400).send('Nelze provádět operace s administrátorem');
        return;
    }
    await conn.query('UPDATE users SET role = "admin" WHERE id = ?', [id]);
    conn.release();
    res.send('Uživatel povýšen');
});

app.patch('/api/admin/user/:id/demote', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID je povinné');
        return;
    }
    const conn = await db.getConnection();
    const targetUser = await conn.query('SELECT * FROM users WHERE id = ?', [id]).then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    if (targetUser.length === 0) {
        res.status(404).send('Uživatel nenalezen');
        return;
    }
    if (targetUser[0].email === user.email) {
        res.status(400).send('Nemůžete degradovat sám sebe');
        return;
    }
    if (targetUser[0].email === 'admin@vysum.to') {
        res.status(400).send('Nelze provádět operace s administrátorem');
        return;
    }
    await conn.query('UPDATE users SET role = "user" WHERE id = ?', [id]);
    conn.release();
    res.send('Uživatel degradován');
});

app.delete('/api/admin/user/:id', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID je povinné');
        return;
    }
    const conn = await db.getConnection();
    const targetUser = await conn.query('SELECT * FROM users WHERE id = ?', [id]).then((result) => {
        return result[0] as UsersModel[];
    }).catch(() => {
        return [];
    });
    if (targetUser.length === 0) {
        res.status(404).send('Uživatel nenalezen');
        return;
    }
    if (targetUser[0].email === user.email) {
        res.status(400).send('Nemůžete povýšit sám sebe');
        return;
    }
    if (targetUser[0].email === 'admin@vysum.to') {
        res.status(400).send('Nelze provádět operace s administrátorem');
        return;
    }
    await conn.query('DELETE FROM users WHERE id = ?', [id]);
    conn.release();
    res.send('Uživatel smazán');
});

app.post('/api/admin/products', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    let { name, price, description, image, mainPage } = req.body;
    if (!name || !price || !description || !image || mainPage === undefined) {
        res.status(400).send('Název, cena, popis a obrázek jsou povinné');
        return;
    }
    const backupImage = image;
    if (image.length > 255) {
        const id = Crypto.randomBytes(16).toString('hex');
        image = "internal:/image/" + id
        writeFileSync(__dirname + "/image/" + id, backupImage.toString());
    }
    const conn = await db.getConnection();
    await conn.query('INSERT INTO products (name, price, description, image, mainPage) VALUES (?, ?, ?, ?, ?)', [name, price, description, image, mainPage]);
    conn.release();
    res.send('Produkt přidán');
});

app.patch('/api/admin/product/:id', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const { id } = req.params;
    let { name, price, description, image, mainPage } = req.body;
    if (!id || !name || !price || !description || !image || mainPage === undefined) {
        res.status(400).send('ID, název, cena, popis a obrázek jsou povinné');
        return;
    }
    const backupImage = image;
    if (image.length > 255) {
        const id = Crypto.randomBytes(16).toString('hex');
        image = "internal:/image/" + id
        writeFileSync(__dirname + "/image/" + id, backupImage.toString());
    }
    const conn = await db.getConnection();
    await conn.query('UPDATE products SET name = ?, price = ?, description = ?, image = ?, mainPage = ? WHERE id = ?', [name, price, description, image, mainPage, id]);
    conn.release();
    res.send('Produkt aktualizován');
});

app.delete('/api/admin/product/:id', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID je povinné');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('DELETE FROM products WHERE id = ?', [id]);
    conn.release();
    res.send('Produkt smazán');
});

app.post('/api/contact', async (req: any, res: any) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        res.status(400).send('Jméno, email a zpráva jsou povinné');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('INSERT INTO contact (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
    conn.release();
    res.send('Zpráva odeslána');
});

app.get('/api/admin/contact', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const conn = await db.getConnection();
    const messages = await conn.query('SELECT * FROM contact').then((result) => {
        return result[0] as { name: string, email: string, message: string }[];
    }).catch(() => {
        return [];
    });
    conn.release();
    res.send(messages);
});

app.delete('/api/admin/contact', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('DELETE FROM contact');
    conn.release();
    res.send('Zprávy smazány');
});

app.delete('/api/admin/contact/:id', AuthMiddleWare, async (req: any, res: any) => {
    const user = req.data.user as UsersModel;
    if (user.role !== 'admin') {
        res.status(403).send('Zakázáno');
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).send('ID je povinné');
        return;
    }
    const conn = await db.getConnection();
    await conn.query('DELETE FROM contact WHERE id = ?', [id]);
    conn.release();
    res.send('Zpráva smazána');
});

app.listen(3000, () => {
    console.log('Server naslouchá na portu 3000');
});