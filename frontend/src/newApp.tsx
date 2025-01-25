import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { store, Product, User } from "./store"
import { toast } from "react-toastify"


export const Navbar = () => {
    const [storage, setStorage] = useState(store.getState())
    store.subscribe(() => {
        setStorage(store.getState())
    })
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
                {
                    window.location.pathname === "/" ? <>
                        <li><a href="#home"><i className="fas fa-home"></i> Domů</a></li>
                        <li><Link to="/products"><i className="fas fa-box"></i> Produkty</Link></li>
                        <li><a href="#about"><i className="fas fa-info-circle"></i> O nás</a></li>
                        <li><a href="#team"><i className="fas fa-users"></i> Náš Tým</a></li>
                        <li><a href="#kontakt"><i className="fas fa-envelope"></i> Kontakt</a></li>
                    </> : <>
                        <li><Link to="/#home"><i className="fas fa-home"></i> Domů</Link></li>
                        <li><Link to="/products"><i className="fas fa-box"></i> Produkty</Link></li>
                        <li><Link to="/#about"><i className="fas fa-info-circle"></i> O nás</Link></li>
                        <li><Link to="/#team"><i className="fas fa-users"></i> Náš Tým</Link></li>
                        <li><Link to="/#kontakt"><i className="fas fa-envelope"></i> Kontakt</Link></li>
                    </>
                }
                {
                    storage.user?.role === "admin" && <li><Link to="/admin"><i className="fas fa-user-shield"></i> Admin</Link></li>
                }
                {storage.user ? <li><Link to="/cart"><i className="fas fa-shopping-cart"></i> Košík</Link></li> :
                    <li><Link to="/login"><i className="fas fa-user-shield"></i>Přihlásit se</Link></li>}
                {storage.user && <li><Link to="/logout"><i className="fas fa-sign-out-alt"></i> Odhlásit se</Link></li>}
            </div>
        </nav>

    </>
}

export const App = () => {
    const [storage, setStorage] = useState(store.getState())
    const [name, setName] = useState("")
    const [email, setEmail] = useState(storage.user?.email || "")
    const [message, setMessage] = useState("")
    store.subscribe(() => {
        setStorage(store.getState())
        if (storage.user && email === "") setEmail(storage.user.email)
    })
    useEffect(() => {
        document.getElementById(window.location.hash.replace("#", ""))?.scrollIntoView()
    }, [])
    const addToCart = (product: Product) => {
        if (!storage.user) {
            toast.error("Přihlašte se nebo zaregistrujte")
            return;
        }
        fetch("/api/user/cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ item_id: product.id }),
            credentials: "include"
        }).then(res => {
            if (res.ok) return toast.success("Přidáno do košíku")
            throw new Error("Failed to add to cart")
        })
            .catch(console.error)
        fetch("/api/user/data", {
            credentials: "include"
        }).then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch user")
        }).then((user: User) => {
            store.getActions().setUser(user)
        }).catch(console.error)

    }
    const postMessage = () => {
        fetch("/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, message }),
            credentials: "include"
        }).then(res => {
            if (res.ok) {
                toast.success("Zpráva odeslána")
                setMessage("")
                return;
            }
            toast.error("Odeslání se nezdařilo")
            throw new Error("Failed to send message")
        }).catch(console.error)
    }
    return <>
        <div className="hero" id="home">
            <div className="hero-content">
                <img src="/favicon.png" alt="Logo" style={{ width: "250px", height: "250px" }} />
                <h1>Zažijte Revoluci ve Vašem Zdraví s Našimi Tabletami!</h1>
                <p>Revoluční kombinace minerálů a vitamínů pro vaši každodenní vitalitu.</p>
                <Link to="/products" className="btn-buy">Prozkoumat Produkty</Link>
            </div>
        </div>
        <div className="hero" id="products">
            <h2 style={{ color: "white", marginBottom: "2rem" }}>Naše Produkty</h2>
            <div className="products-list">
                {storage.products.filter(product => product.mainPage).map(product => (
                    <div className="product" key={product.id}>
                        <img src={product.image} alt={product.name} className="product-image" />
                        <div className="product-content">
                            <h3>{product.name}</h3>
                            <p>{product.description}</p>
                            <p className="price">{product.price.toFixed(2)} Kč</p>
                            <button className="btn-buy" onClick={() => addToCart(product)}>Do košíku</button>
                            {
                                storage.user?.items.find(item => item.id === product.id) && <p style={{ color: "green", fontSize: "16px" }}>V košíku máte {storage.user.items.find(item => item.id === product.id)?.quantity} ks</p>
                            }
                        </div>
                    </div>
                ))}
            </div>
            <Link to="/products" className="btn-buy pd">Prozkoumat Více</Link>
        </div>
        <div className="hero" id="about">
            <h2>O Nás</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quae?</p>
        </div>
        <div className="hero" id="team">
            <h2>Náš Tým</h2>
            <div className="team-members">
                <div className="team-member">
                    <img src="https://michlip.eu/favicon.png" alt="Jan Novák" />
                    <h3>Jan Novák</h3>
                </div>
                <div className="team-member">
                    <img src="https://michlip.eu/favicon.png" alt="Petra Svobodová" />
                    <h3>Petra Svobodová</h3>
                </div>
                <div className="team-member">
                    <img src="https://michlip.eu/favicon.png" alt="Martin Dvořák" />
                    <h3>Martin Dvořák</h3>
                </div>
            </div>
        </div>
        <section className="hero" id="kontakt" style={{ color: "white" }} data-primary="#feb47b" data-secondary="#6a11cb">
            <h2>Kontakt</h2>
            <p>Máte nějaké otázky nebo potřebujete více informací? Kontaktujte nás:</p>
            <ul>
                <li><i className="fas fa-envelope"></i> Email: info@vysum.to</li>
                <li><i className="fas fa-phone-alt"></i> Telefon: +420 123 456 789</li>
                <li><i className="fas fa-map-marker-alt"></i> Adresa: Ulice 123, Město, Česká republika</li>
            </ul>
            <form className="contact-form" style={{ width: "95%", maxWidth: "600px", margin: "auto" }} onSubmit={e => { e.preventDefault(); postMessage() }}>
                <label htmlFor="name"><i className="fas fa-user"></i> Jméno:</label>
                <input type="text" id="name" name="name" required value={name} onChange={e => setName(e.target.value)} />

                <label htmlFor="email"><i className="fas fa-at"></i> Email:</label>
                <input type="email" id="email" name="email" required value={email} onChange={e => setEmail(e.target.value)} />

                <label htmlFor="message"><i className="fas fa-comment-dots"></i> Zpráva:</label>
                <textarea id="message" name="message" rows={5} required value={message} onChange={e => setMessage(e.target.value)}></textarea>

                <button type="submit" className="btn-submit"><i className="fas fa-paper-plane"></i> Odeslat</button>
            </form>
        </section>

    </>
}

interface Cache {
    id: number,
    quantity: number
}

export const Products = () => {
    const [storage, setStorage] = useState(store.getState())
    const [search, setSearch] = useState("")
    const [cached, setCached] = useState<Cache[]>([])
    useEffect(() => {
        setInterval(() => {
            setCached((cs) => {
                if (cs.length > 0) {
                    for (let i = 0; i < cs.length; i++) {
                        fetch("/api/user/cart/add", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ item_id: cs[i].id, quantity: cs[i].quantity }),
                            credentials: "include"
                        }).then(res => {
                            if (res.ok) return;
                            throw new Error("Failed to add to cart")
                        }).catch((err) => {
                            console.error(err)
                        })
                    }
                }
                fetch("/api/user/data", {
                    credentials: "include"
                }).then(res => {
                    if (res.ok) return res.json()
                    throw new Error("Failed to fetch user")
                }).then((user: User) => {
                    store.getActions().setUser(user)
                }).catch(console.error)
                return []
            })
        }, 1000)
    }, [])
    store.subscribe(() => {
        setStorage(store.getState())
    })
    const addToCart = (product: Product) => {
        if (!storage.user) {
            toast.error("Přihlašte se nebo zaregistrujte")
            return;
        }
        setCached((cs) => {
            const index = cs.findIndex(c => c.id === product.id)
            if (index !== -1) {
                cs[index].quantity += 1
                return cs
            }
            return [...cs, { id: product.id, quantity: 1 }]
        })
    }
    return <>
        <div className="container">
            <div className="top-group" style={{ color: "white" }}>
                <h1>Produkty</h1>
                <input className="searchComponent" type="text" placeholder="Hledat..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="products-list">
                {search ? storage.products.filter(product => (product.name.toLowerCase().includes(search.toLowerCase()) || product.description.toLowerCase().includes(search.toLowerCase()) || product.price.toFixed(2).toString().includes(search.toLowerCase()))).length === 0 ? <>
                    <div style={{ textAlign: "center", color: "white" }}>
                        <h2>Žádné výsledky</h2>
                        <p>Pro hledaný výraz <strong>{search}</strong> nebyly nalezeny žádné výsledky</p>
                    </div>
                </> : storage.products.filter(product => (product.name.toLowerCase().includes(search.toLowerCase()) || product.description.toLowerCase().includes(search.toLowerCase()) || product.price.toFixed(2).toString().includes(search.toLowerCase()))).map(product => (
                    <div className="product" key={product.id}>
                        <img src={product.image} alt={product.name} className="product-image" />
                        <div className="product-content">
                            <h3>{product.name}</h3>
                            <p>{product.description}</p>
                            <p className="price">{product.price.toFixed(2)} Kč</p>
                            <button className="btn-buy" onClick={() => addToCart(product)}>Do košíku</button>
                            {
                                storage.user?.items.find(item => item.id === product.id) && <p style={{ color: "green" }}>V košíku máte {storage.user.items.find(item => item.id === product.id)?.quantity} ks</p>
                            }
                        </div>
                    </div>
                )) : storage.products.map(product => (
                    <div className="product" key={product.id}>
                        <img src={product.image} alt={product.name} className="product-image" />
                        <div className="product-content">
                            <h3>{product.name}</h3>
                            <p>{product.description}</p>
                            <p className="price">{product.price.toFixed(2)} Kč</p>
                            <button className="btn-buy" onClick={() => addToCart(product)}>Do košíku</button>
                            {
                                storage.user?.items.find(item => item.id === product.id) && <p style={{ color: "green" }}>V košíku máte {storage.user.items.find(item => item.id === product.id)?.quantity} ks</p>
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </>
}

export const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const login = () => {
        setLoading(true)
        fetch("/api/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        }).then(async (res) => {
            if (res.ok) {
                fetch("/api/user/data", {
                    credentials: "include"
                }).then(res => {
                    if (res.ok) return res.json()
                    toast.error("Přihlášení se nezdařilo")
                    throw new Error("Failed to fetch user")
                }).then((user: User) => {
                    toast.success("Přihlášení proběhlo úspěšně")
                    navigate("/")
                    store.getActions().setUser(user)
                }).catch(console.error)
                return;
            }
            toast.error("Přihlášení se nezdařilo")
            throw new Error(await res.text())
        }).then(console.log)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }
    return <>
        <div className="container">
            <form onSubmit={e => { e.preventDefault(); login() }}>
                <h1>Přihlášení</h1>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Heslo:</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading}>{loading ? "Přihlašuji..." : "Přihlásit se"}</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <p>Nemáte účet? <Link to="/register">Registrovat se</Link></p>
            </form>
        </div>
        <style>{`
            .container {
                padding: 2rem;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center

            }
            form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                width: 100%;
                max-width: 300px;
                background-color: white;
                padding: 2rem;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            form h1 {
                text-align: center;
            }
            .form-group {
                display: flex;
                flex-direction: column;
            }
            label {
                font-weight: bold;
            }
            input, button {
                padding: 0.5rem;
                border-radius: 5px;
                border: 1px solid #6200ea;
            }
            button {
                background-color: #6200ea;
                color: white;
                border: none;
                cursor: pointer;
            }
            button:disabled {
                color: #666;
                cursor: not-allowed;
            }
                p {
                    text-align: center;
                }
        `}</style>
    </>
}

export const Register = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const login = () => {
        setLoading(true)
        fetch("/api/user/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        }).then(async (res) => {
            if (res.ok) {
                fetch("/api/user/data", {
                    credentials: "include"
                }).then(res => {
                    if (res.ok) return res.json()
                    toast.error("Přihlášení se nezdařilo")
                    throw new Error("Failed to fetch user")
                }).then((user: User) => {
                    toast.success("Registrace proběhla úspěšně")
                    navigate("/")
                    store.getActions().setUser(user)
                }).catch(console.error)
                return;
            }
            toast.error("Přihlášení se nezdařilo")
            throw new Error(await res.text())
        }).then(console.log)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }
    return <>
        <div className="container">
            <form onSubmit={e => { e.preventDefault(); login() }}>
                <h1>Registrace</h1>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Heslo:</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading}>{loading ? "Registuji..." : "Registrovat se"}</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <p>Již máte účet? <Link to="/login">Přihlásit se</Link></p>
            </form>
        </div>
        <style>{`
            .container {
                padding: 2rem;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center

            }
            form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                width: 100%;
                max-width: 300px;
                background-color: white;
                padding: 2rem;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            form h1 {
                text-align: center;
            }
            .form-group {
                display: flex;
                flex-direction: column;
            }
            label {
                font-weight: bold;
            }
            input, button {
                padding: 0.5rem;
                border-radius: 5px;
                border: 1px solid #6200ea;
            }
            button {
                background-color: #6200ea;
                color: white;
                border: none;
                cursor: pointer;
            }
            button:disabled {
                color: #666;
                cursor: not-allowed;
            }
                p {
                    text-align: center;
                }
        `}</style>
    </>
}

export const Cart = () => {
    const [storage, setStorage] = useState(store.getState())
    store.subscribe(() => {
        setStorage(store.getState())
    })
    const removeFromCart = (product: any, toas = true) => {
        fetch("/api/user/cart/remove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ item_id: product.id }),
            credentials: "include"
        }).then(res => {
            if (res.ok) return toas ? toast.success("Odebráno z košíku") : ""
            toast.error("Odebrání se nezdařilo")
            throw new Error("Failed to remove from cart")
        })
            .catch(console.error)
        fetch("/api/user/data", {
            credentials: "include"
        }).then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch user")
        }).then((user: User) => {
            store.getActions().setUser(user)
        }).catch(console.error)
    }
    const removeFromCartAll = (product: any) => {
        for (let i = 0; i < product.quantity; i++) {
            setTimeout(() => removeFromCart(product, false), i * 100)
        }
        toast.success("Odebráno z košíku")
    }

    const clearCart = () => {
        fetch("/api/user/cart/clear", {
            credentials: "include"
        }).then(res => {
            if (res.ok) return toast.success("Košík byl vyprázdněn")
            toast.error("Vyprázdnění se nezdařilo")
            throw new Error("Failed to clear cart")
        }).then(console.log)
            .catch(console.error)
        fetch("/api/user/data", {
            credentials: "include"
        }).then(res => {
            if (res.ok) return res.json()
            throw new Error("Failed to fetch user")
        }).then((user: User) => {
            store.getActions().setUser(user)
        }).catch(console.error)
    }
    return <>
        <div className="container">
            <h1>Košík</h1>
            <div className="products-list">
                {storage.user?.items.map(product => (
                    <div className="product" key={product.id}>
                        <img src={product.image} alt={product.name} className="product-image" />
                        <div className="product-content">
                            <h3>{product.name}</h3>
                            <p>{product.description}</p>
                            <p className="price">{product.price.toFixed(2)} Kč</p>
                            <p>Množství: {product.quantity}</p>
                            <p>Celkem: {(product.price * product.quantity).toFixed(2)} Kč</p>
                            <button className="btn-buy" onClick={() => removeFromCart(product)}><i className="fas fa-trash"></i> Odebrat jednu položku</button>
                            <button className="btn-buy" onClick={() => removeFromCartAll(product)}><i className="fas fa-trash-alt"></i> Odebrat vše</button>
                        </div>
                    </div>
                ))}
            </div>
            <p style={{ textAlign: "right", fontSize: "1.5rem", fontWeight: "bold" }}>Celkem: {storage.user?.items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)} Kč</p>
            <button className="btn-buy" onClick={clearCart}><i className="fas fa-trash"></i> Vyprázdnit košík</button>
        </div>
        <style>{`
            .container {
                padding: 2rem;
            }
            .products-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 2rem;
            }
            .product {
                background-color: #6200ea;
                padding: 1rem;
                border-radius: 5px;
                color: white;
                height: 100vh;
                max-height: 600px;
                width: 100%;
                max-width: 300px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                background-color: snow;
                color: rgb(0, 0, 0);
                text-align: center;
            }
            .product .btn-buy {
                background-color: #6200ea;
                color: white;
            }
            .product-image {
                width: 100%;
                border-radius: 5px;
            }
            .price {
                font-size: 1.5rem;
                font-weight: bold;
            }
            @media (max-width: 768px) {
                .container {
                    padding: 1rem;
                }
                .products-list {
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                }
                .product {
                    height: auto;
                    width: 280px;
                }
            }

            .btn-buy {
                background-color: white;
                color: #6200ea;
                padding: 0.5rem 1rem;
                margin-left: 0.5rem;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: 0.3s;
            }
            .btn-buy:hover {
                transform: scale(1.1);
            }

        `}</style>
    </>
}

export const Logout = () => {
    const navigate = useNavigate()
    useEffect(() => {
        fetch("/api/user/logout", {
            credentials: "include"
        }).then(() => {
            store.getActions().setUser(undefined)
            navigate("/")
        }).catch(console.error)
    }, [])
    return null
}