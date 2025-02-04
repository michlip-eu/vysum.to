import { action, Action, createStore } from 'easy-peasy'

export interface Order {
    city: string
    id: number
    items: Product[]
    name: string
    phone: string
    status: string
    street: string
    surname: string
    user_id: number
    zip: string
}

export interface User {
    id: number
    name: string
    email: string
    role: string
    orders: Order[]
    items: {
        id: number
        name: string
        image: string
        description: string
        price: number
        quantity: number
    }[]
}

export interface StoreModel {
    user: User | undefined
    products: Product[]

    setUser: Action<StoreModel, User | undefined>
    setProducts: Action<StoreModel, Product[]>
}

export interface Product {
    id: number
    name: string
    description: string
    price: number
    image: string
    mainPage: boolean
}

export const store = createStore<StoreModel>({
    user: undefined,
    products: [],

    setUser: action((state, payload) => {
        state.user = payload
    }),
    setProducts: action((state, payload) => {
        console.log(payload, "payload")
        state.products = payload
    })
})