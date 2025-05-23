export interface UsersModel {
    id: number
    email: string
    password: string
    role: string
}
export interface CartModel {
    id: number
    user_id: number
    item_id: number
    quantity: number
}
export interface ItemsModel {
    id: number
    name: string
    price: number
    description: string
    image: string
}
export interface JwtToken {
    id: number
    iat: number
    exp: number
}