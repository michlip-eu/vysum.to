import { useEffect, useState } from "react"
import { Product, store, User } from "./store"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

export const AdminNavbar = () => {
    const setProducts = store.getActions().setProducts
    useEffect(() => {
        fetch("/api/products").then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch products")
        }).then((products: Product[]) => {
            setProducts(products)
            console.log(products)
        }).catch(console.error)
        fetch("/api/user/data", {
            credentials: "include"
        }).then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch user")
        }).then((user: User) => {
            store.getActions().setUser(user)
        }).catch(console.error)
    }, [])
    return <>
        <nav className="navbar">

            <Link className="navbar-brand" to="/">vysum.to</Link>
            <div className={`navbar-links`}>
                <li><Link to="/admin/products"><i className="fas fa-box"></i> Produkty</Link></li>
                <li><Link to="/admin/users"><i className="fas fa-users"></i> Uživatelé</Link></li>
                <li><Link to="/admin/orders"><i className="fas fa-shopping-cart"></i> Objednávky</Link></li>
                <li><Link to="/admin/messages"><i className="fas fa-envelope"></i> Zprávy</Link></li>
                <li><Link to="/"><i className="fas fa-home"></i> Domů</Link></li>
                <li><Link to="/logout"><i className="fas fa-sign-out-alt"></i> Odhlásit se</Link></li>
            </div>
        </nav>

    </>
}

export const AdminOverlay = () => {
    const navigate = useNavigate()
    const [storage, setStorage] = useState(store.getState())
    store.subscribe(() => {
        setStorage(store.getState())
    })
    useEffect(() => {
        fetch("/api/products").then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch products")
        }).then((products: Product[]) => {
            store.getActions().setProducts(products)
            console.log(products)
        }).catch(console.error)
        fetch("/api/user/data", {
            credentials: "include"
        }).then(res => {
            if (res.ok) return res.json()
            navigate("/")
            throw new Error("Failed to fetch user")
        }).then((user: User) => {
            store.getActions().setUser(user)
        }).catch(console.error)
    }, [])
    if (!storage.user) return <div style={{ color: "white", fontSize: "2rem", textAlign: "center", marginTop: "2rem" }}>
        Načítání...
    </div>
    if (storage.user && storage.user?.role !== "admin") {
        navigate("/")
        return <div style={{ color: "white", fontSize: "2rem", textAlign: "center", marginTop: "2rem" }}>
            Přístup odepřen
        </div>
    }
    return <>
        <AdminNavbar />
        <Outlet />
    </>
}

export const AdminMainPage = () => {
    return <div className="hero">
        <div className="hero-content">
            <h1>Výtej na administračním panelu</h1>
            <p>Zde můžeš spravovat produkty, uživatele, objednávky a zprávy.</p>
        </div>
    </div>
}

export const AdminProducts = () => {
    const [products, setProducts] = useState(store.getState().products)
    store.subscribe(() => {
        setProducts(store.getState().products)
    })
    const deleteProduct = (id: number) => {
        fetch(`/api/admin/product/${id}`, {
            method: "DELETE",
            credentials: "include"
        }).then(res => {
            fetch("/api/products").then(res => {
                if (res.ok) return res.json()
                throw new Error("Failed to fetch products")
            }).then((products: Product[]) => {
                store.getActions().setProducts(products)
                console.log(products)
            }).catch(console.error)
            if (res.ok) return toast.success("Produkt byl smazán")
            toast.error("Nepodařilo se smazat produkt")
            throw new Error("Failed to delete product")
        }).then(console.log).catch(console.error)
    }
    return <div className="container">
        <div className="top-group">
            <h1>Produkty</h1>
            <Link to="/admin/product-add" className="btn-buy">Přidat produkt</Link>
        </div>
        <div className="products-list">
            {products.map(product => (
                <div className="product" key={product.id}>
                    <img src={product.image} alt={product.name} className="product-image" />
                    <div className="product-content">
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p className="price">{product.price.toFixed(2)} Kč</p>
                        <Link to={`/admin/product/${product.id}`} className="btn-buy">Upravit</Link>
                        <button className="btn-buy" onClick={() => deleteProduct(product.id)}>Smazat</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
}

export const AdminProductAdd = () => {
    const navigate = useNavigate()
    const [name, setName] = useState("")
    const [price, setPrice] = useState("0")
    const [description, setDescription] = useState("")
    const [image, setImage] = useState("")
    const [mainPage, setMainPage] = useState(false)
    const addProduct = () => {
        fetch("/api/admin/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                price,
                description,
                image,
                mainPage
            }),
            credentials: "include"
        }).then(res => {
            if (res.ok) return toast.success("Produkt byl přidán")
            toast.error("Nepodařilo se přidat produkt")
            throw new Error("Failed to add product")
        }).then(() => {
            navigate("/admin/products")
            fetch("/api/products").then(res => {
                if (res.ok) return res.json()
                throw new Error("Failed to fetch products")
            }).then((products: Product[]) => {
                store.getActions().setProducts(products)
                console.log(products)
            }).catch(console.error)
        }).catch(console.error)
    }
    const fileChange = (e: any) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onloadend = () => {
            setImage(reader.result as string)
        }
        reader.readAsDataURL(file)
    }
    return <div className="container">
        <div className="top-group">
            <h1>Přidat produkt</h1>
        </div>
        <div className="product-add">
            <label htmlFor="name">Název</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} />
            <label htmlFor="price">Cena</label>
            <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} />
            <label htmlFor="description">Popis</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
            <label htmlFor="image">Obrázek</label>
            <img src={image} alt="Obrázek" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
            <div className="image-group">
                <input type="text" id="image" value={image} onChange={e => setImage(e.target.value)} />
                <span>nebo</span>
                <input type="file" id="image-file" accept="image/*" onChange={fileChange} />
            </div>
            <label htmlFor="mainPage">Zobrazit na hlavní stránce</label>
            <input type="checkbox" id="mainPage" checked={mainPage} onChange={e => setMainPage(e.target.checked)} />
            <button className="btn-buy" onClick={addProduct}>Přidat produkt</button>
            <style>
                {`
            .product-add {
                display: flex;
                flex-direction: column;
                max-width: 600px;
                margin: 2rem auto;
                padding: 2rem;
                background-color: #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .product-add label {
                margin-top: 1rem;
                font-weight: 600;
                color: #333;
            }

            .product-add input[type="text"],
            .product-add input[type="number"],
            .product-add textarea {
                width: 100%;
                padding: 0.75rem;
                margin-top: 0.5rem;
                border: 1px solid #bbb;
                border-radius: 4px;
                font-size: 1rem;
            }

            .product-add textarea {
                resize: vertical;
                min-height: 100px;
            }

            .image-group {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-top: 0.5rem;
            }

            .image-group input[type="text"] {
                flex: 1;
            }

            .image-group input[type="file"] {
                padding: 0.5rem;
            }

            .btn-buy {
                margin-top: 1.5rem;
                padding: 0.75rem 1.5rem;
                background-color: #0056b3;
                color: #fff;
                border: none;
                border-radius: 4px;
                font-size: 1rem;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }

            .btn-buy:hover {
                background-color: #003f7f;
            }

            @media (max-width: 600px) {
                .product-add {
                    padding: 1rem;
                }

                .btn-buy {
                    width: 100%;
                    text-align: center;
                }
            }
            `}</style>
        </div>
    </div>
}

export const AdminProductEdit = () => {
    const [storage, setStorage] = useState(store.getState())
    store.subscribe(() => {
        setStorage(store.getState())
    })
    const navigate = useNavigate()
    const id = parseInt(window.location.pathname.split("/").pop() as string)
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [description, setDescription] = useState("")
    const [image, setImage] = useState("")
    const [mainPage, setMainPage] = useState(false)
    useEffect(() => {
        const product = store.getState().products.find(p => p.id === id)
        if (product) {
            setName(product.name)
            setPrice(product.price.toFixed(2))
            setDescription(product.description)
            setImage(product.image)
            setMainPage(product.mainPage)
        }
    }, [storage])
    if (!name) return <div style={{ color: "white", fontSize: "2rem", textAlign: "center", marginTop: "2rem" }}>
        Produkt nenalezen
    </div>
    const editProduct = () => {
        fetch(`/api/admin/product/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                price,
                description,
                image,
                mainPage
            }),
            credentials: "include"
        }).then(res => {
            if (res.ok) return toast.success("Produkt byl upraven")
            toast.error("Nepodařilo se upravit produkt")
            throw new Error("Failed to edit product")
        }).then(() => {
            navigate("/admin/products")
            fetch("/api/products").then(res => {
                if (res.ok) return res.json()
                throw new Error("Failed to fetch products")
            }).then((products: Product[]) => {
                store.getActions().setProducts(products)
                console.log(products)
            }).catch(console.error)
        }).catch(console.error)
    }
    const fileChange = (e: any) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onloadend = () => {
            setImage(reader.result as string)
        }
        reader.readAsDataURL(file)
    }
    return <div className="container">
        <div className="top-group">
            <h1>Upravit produkt</h1>
        </div>
        <div className="product-add">
            <label htmlFor="name">Název</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} />
            <label htmlFor="price">Cena</label>
            <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} />
            <label htmlFor="description">Popis</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
            <label htmlFor="image">Obrázek</label>
            <img src={image} alt="Obrázek" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
            <div className="image-group">
                <input type="text" id="image" value={image} onChange={e => setImage(e.target.value)} />
                <span>nebo</span>
                <input type="file" id="image-file" accept="image/*" onChange={fileChange} />
            </div>
            <label htmlFor="mainPage">Zobrazit na hlavní stránce</label>
            <input type="checkbox" id="mainPage" checked={mainPage} onChange={e => setMainPage(e.target.checked)} />
            <button className="btn-buy" onClick={editProduct}>Upravit produkt</button>
            <style>
                {`
            .product-add {
                display: flex;
                flex-direction: column;
                max-width: 600px;
                margin: 2rem auto;
                padding: 2rem;
                background-color: #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
                    
            .product-add label {
                margin-top: 1rem;
                font-weight: 600;
                color: #333;
            }
                    
            .product-add input[type="text"],
            .product-add input[type="number"],
            .product-add textarea {
                width: 100%;
                padding: 0.75rem;
                margin-top: 0.5rem;
                border: 1px solid #bbb;
                border-radius: 4px;
                font-size: 1rem;
            }
                    
            .product-add textarea {
                resize: vertical;
                min-height: 100px;
            }
    
            .image-group {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-top: 0.5rem;
            }
    
            .image-group input[type="text"] {
                flex: 1;
            }
    
            .image-group input[type="file"] {
                padding: 0.5rem;
            }
    
            .btn-buy {
                margin-top: 1.5rem;
                padding: 0.75rem 1.5rem;
                background-color: #0056b3;
                color: #fff;
                border: none;
                border-radius: 4px;
                font-size: 1rem;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
    
            .btn-buy:hover {
                background-color: #003f7f;
            }
    
            @media (max-width: 600px) {
                .product-add {
                    padding: 1rem;
                }
    
                .btn-buy {
                    width: 100%;
                    text-align: center;
                }
            }
            `}</style>
        </div>
    </div>
}

export const AdminUsers = () => {
    const [users, setUsers] = useState([])
    const [storage, setStorage] = useState(store.getState())
    store.subscribe(() => {
        setStorage(store.getState())
    })
    useEffect(() => {
        fetch("/api/admin/users", {
            credentials: "include"
        }).then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch users")
        }).then(users => {
            setUsers(users)
            console.log(users)
        }).catch(console.error)
    }, [])
    const degradeUser = (id: number) => {
        toast.promise(fetch(`/api/admin/user/${id}/demote`, {
            method: "PATCH",
            credentials: "include"
        }).then(async (res) => {
            if (res.ok) return;
            throw new Error(await res.text())
        }).then(() => {
            fetch("/api/admin/users", {
                credentials: "include"
            }).then(res => {
                if (res.ok) return res.json()
            }).then(users => {
                setUsers(users)
                console.log(users)
            })
        }), {
            pending: "Demotuji uživatele...",
            success: "Uživatel byl demotovan",
            error: {
                render({ data }) {
                    return `${data}`
                }
            }
        })
    }
    const promoteUser = (id: number) => {
        toast.promise(fetch(`/api/admin/user/${id}/promote`, {
            method: "PATCH",
            credentials: "include"
        }).then(async (res) => {
            if (res.ok) return;
            throw new Error(await res.text())
        }).then(() => {
            fetch("/api/admin/users", {
                credentials: "include"
            }).then(res => {
                if (res.ok) return res.json()
            }).then(users => {
                setUsers(users)
                console.log(users)
            })
        }), {
            pending: "Promotuji uživatele...",
            success: "Uživatel byl promován",
            error: {
                render({ data }) {
                    return `${data}`
                }
            }
        })
    }
    const deleteUser = (id: number) => {
        toast.promise(fetch(`/api/admin/user/${id}`, {
            method: "DELETE",
            credentials: "include"
        }).then(async (res) => {
            if (res.ok) return;
            throw new Error(await res.text())
        }).then(() => {
            fetch("/api/admin/users", {
                credentials: "include"
            }).then(res => {
                if (res.ok) return res.json()
            }).then(users => {
                setUsers(users)
                console.log(users)
            })
        }), {
            pending: "Mažu uživatele...",
            success: "Uživatel byl smazán",
            error: {
                render({ data }) {
                    return `${data}`
                }
            }
        })
    }
    return <div className="container">
        <div className="top-group">
            <h1>Uživatelé</h1>
        </div>
        <div className="users-list">
            {users.map((user: User) => (
                <div className="user" key={user.id}>
                    <h3>{user.email}</h3>
                    <p>{user.role}</p>
                    {
                        user.role === "admin" ? <button className="btn-buy" onClick={() => degradeUser(user.id)} disabled={user.id === storage.user?.id || user.email === "admin@vysum.to"}>Degradovat</button> : <button onClick={() => promoteUser(user.id)} className="btn-buy">Povýšit</button>
                    }
                    <button className="btn-buy" onClick={() => deleteUser(user.id)} disabled={user.email === "admin@vysum.to"}>Smazat</button>
                </div>
            ))}
        </div>
        <style>
            {`
        .users-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }

        .user {
            padding: 1rem;
            background-color: #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .user h3 {
            margin-bottom: 0.5rem;
        }

        .user p {
            margin-bottom: 1rem;
        }

        .btn-buy {
            padding: 0.5rem 1rem;
            background-color: #0056b3;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .btn-buy:hover {
            background-color: #003f7f;
        }
            
        .btn-buy:disabled {
            background-color: #bbb;
            cursor: not-allowed;
        }
        `}
        </style>
    </div>
}
export const AdminContact = () => {
    const [messages, setMessages] = useState([])
    useEffect(() => {
        fetch("/api/admin/contact").then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch messages")
        }).then(messages => {
            setMessages(messages)
            console.log(messages)
        }).catch(console.error)
    }, [])
    return <div className="container">
        <div className="top-group">
            <h1>Zprávy</h1>
            <button className="btn-buy" onClick={() => {
                fetch("/api/admin/contact", {
                    method: "DELETE",
                    credentials: "include"
                }).then(res => {
                    if (res.ok) return toast.success("Zprávy byly smazány")
                    throw new Error("Failed to delete messages")
                }).then(() => {
                    fetch("/api/admin/contact").then(res => {
                        if (res.ok) return res.json()
                        throw new Error("Failed to fetch messages")
                    }).then(messages => {
                        setMessages(messages)
                        console.log(messages)
                    }).catch(console.error)
                }).catch(console.error)
            }}>Smazat zprávy</button>
        </div>
        <div className="messages-list">
            {messages.map((message: any) => (
                <div className="message" key={message.id}>
                    <h3>{message.name}</h3>
                    <h3>{message.email}</h3>
                    <p>{message.message}</p>
                    <button className="btn-buy" onClick={() => {
                        fetch(`/api/admin/contact/${message.id}`, {
                            method: "DELETE",
                            credentials: "include"
                        }).then(res => {
                            if (res.ok) return toast.success("Zpráva byla smazána")
                            throw new Error("Failed to delete message")
                        }).then(() => {
                            fetch("/api/admin/contact").then(res => {
                                if (res.ok) return res.json()
                                throw new Error("Failed to fetch messages")
                            }).then(messages => {
                                setMessages(messages)
                                console.log(messages)
                            }).catch(console.error)
                        }).catch(console.error)
                    }}>Smazat zprávu</button>
                </div>
            ))}
            <style>
                {`
            .messages-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1rem;
            }

            .message {
                padding: 1rem;
                background-color: #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .message h3 {
                margin-bottom: 0.5rem;
            }

            .message p {
                margin-bottom: 1rem;
                width: 100%;
                overflow-wrap: break-word;
            }
            `}
            </style>
        </div>
    </div>
}

export const AdminOrders = () => {
    const [orders, setOrders] = useState([])
    const stages = [
        "Vyřizuje se",
        "Potvrzeno",
        "Odesláno",
        "Doručeno"
    ]
    const buttons = [
        "Potvrdit",
        "Odeslat",
        "Doručit"
    ]
    const urls = [
        "/api/admin/orders/confirm/",
        "/api/admin/orders/ship/",
        "/api/admin/orders/deliver/"
    ]
    useEffect(() => {
        fetch("/api/admin/orders").then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch orders")
        }).then(orders => {
            setOrders(orders)
            console.log(orders)
        }).catch(console.error)
    }, [])
    const change = (id: number, stage: number) => {
        fetch(urls[stage] + id, {
            method: "PATCH",
            credentials: "include"
        }).then(res => {
            if (res.ok) return toast.success("Objednávka byla změněna")
            throw new Error("Failed to change order")
        }).then(() => {
            fetch("/api/admin/orders").then(res => {
                if (res.ok) return res.json()
                throw new Error("Failed to fetch orders")
            }).then(orders => {
                setOrders(orders)
                console.log(orders)
            }).catch(console.error)
        }).catch(console.error)
    }
    return <div className="container">
        <div className="top-group">
            <h1>Objednávky</h1>
        </div>
        <div className="orders-list">
            {orders.map((order: any) => (
                <div className="order" key={order.id}>
                    <h3>{order.name} {order.surname}</h3>
                    <h3>{order.phone}</h3>
                    <h3>{order.email}</h3>
                    <p>{order.street}</p>
                    <p>{order.city}</p>
                    <p>{order.zip}</p>
                    <p>{order.status}</p>
                    <Link to={`/admin/order/${order.id}`} className="btn-buy">Detail</Link>
                    {order.status !== "Doručeno" && <button className="btn-buy" onClick={() => change(order.id, stages.indexOf(order.status))}>{buttons[stages.indexOf(order.status)]}</button>}
                </div>
            ))}
        </div>
        <style>
            {`
        .orders-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }

        .order {
            padding: 1rem;
            background-color: #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .order h3 {
            margin-bottom: 0.5rem;
        }

        .order p {
            margin-bottom: 1rem;
        }

        .items {
            margin-top: 1rem;
            display: grid;
            gap: 1rem;
        }


        .item {
            padding: 0.5rem;
            background-color: #ccc;
            border-radius: 8px;
        }

        .item h3 {
            margin-bottom: 0.5rem;
        }

        .item p {
            margin-bottom: 0.5rem;
        }

        .btn-buy {
            padding: 0.5rem 1rem;
            background-color: #0056b3;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .btn-buy:hover {
            background-color: #003f7f;
        }
        `}
        </style>
    </div>
}

export const AdminOrderDetail = () => {
    const [order, setOrder] = useState({})
    const [storage, setStorage] = useState(store.getState())
    store.subscribe(() => {
        setStorage(store.getState())
    })
    const stages = [
        "Vyřizuje se",
        "Potvrzeno",
        "Odesláno",
        "Doručeno"
    ]
    const buttons = [
        "Potvrdit",
        "Odeslat",
        "Doručit"
    ]
    const urls = [
        "/api/admin/orders/confirm/",
        "/api/admin/orders/ship/",
        "/api/admin/orders/deliver/"
    ]
    useEffect(() => {
        const id = parseInt(window.location.pathname.split("/").pop() as string)
        fetch(`/api/admin/orders`).then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch order")
        }).then(order => {
            setOrder(order.find((o: any) => o.id === id))
            console.log(order)
        }).catch(console.error)
    }, [])
    const change = (id: number, stage: number) => {
        fetch(urls[stage] + id, {
            method: "PATCH",
            credentials: "include"
        }).then(res => {
            if (res.ok) return toast.success("Objednávka byla změněna")
            throw new Error("Failed to change order")
        }).then(() => {
            fetch(`/api/admin/order/${id}`).then(res => {
                if (res.ok) return res.json()
                throw new Error("Failed to fetch order")
            }).then(order => {
                setOrder(order)
                console.log(order)
            }).catch(console.error)
        }).catch(console.error)
    }
    return <div className="container">
        <div className="top-group">
            <h1>Detail objednávky</h1>
        </div>
        <div className="products-list">
            {order.items && order.items.map((item: any) => (
                <div className="product" key={item.id}>
                    <img src={item.image} alt={item.name} className="product-image" />
                    <div className="product-content">
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <p className="price">{item.price.toFixed(2)} Kč</p>
                        <p>Množství: {item.quantity}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
}
