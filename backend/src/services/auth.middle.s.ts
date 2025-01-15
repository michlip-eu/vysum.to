import { UsersModel } from "@/modelx/users.m"
import jwt from "./jwt.s"
import db from "./database.s"


export const AuthMiddleWare = async (req: any, res: any, next: any) => {
    const UserToken = req.cookies.Authorization
    if (!UserToken) return res.status(401).send("User token can't be provided")
    const TokenData = await jwt.verify(UserToken)
    if (!TokenData) return res.status(401).send("User token can't be validated")
    const connection = await db.getConnection();
    const [userData] = await connection.query("SELECT * FROM users WHERE id = ?", [TokenData.id]).catch(() => {
        return [[]]
    }) as [UsersModel[]]
    const user = userData[0]
    if (!user) return res.status(404).send("Account does not exist!")
    req.data = {}
    req.data.token = TokenData
    req.data.user = user
    next()
}