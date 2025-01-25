import { JwtToken, UsersModel } from "@/models/users.m";

declare namespace Express {
    export interface Request {
        token?: JwtToken // I use string for example, you can put other type
        data?: UsersModel
    }
}