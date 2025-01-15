import fs, { access } from "fs";
import jwtt from "jsonwebtoken";
import { JwtToken } from "@/modelx/users.m";

// const privateKey = fs.readFileSync('/run/secrets/private-key');
// const publicKey = fs.readFileSync('/run/secrets/public-key');

const privateKey = fs.readFileSync(__dirname + '/private.pem')
const publicKey = fs.readFileSync(__dirname + '/public.pem')

const issue = (data: any) => {
    return {
        accessToken: jwtt.sign(data, privateKey, {
            algorithm: "RS256",
            expiresIn: "1h"
        }),
        refreshToken: jwtt.sign(data, privateKey, {
            algorithm: "RS256"
        }),
    }
}

const reissue = (refreshToken: string) => {
    const token = verify(refreshToken)
    return {
        accessToken: jwtt.sign(token, privateKey, {
            "algorithm": "RS256"
        }),
        refreshToken
    }
}

const verify = (token: string): Promise<JwtToken | null> => {
    return new Promise((resolve) => {
        try {

            const TokenResult = jwtt.verify(token, publicKey, {
                algorithms: ["RS256"]
            }) as JwtToken;
            resolve(TokenResult)
        } catch (e) {
            resolve(null)
        }
    })
}


export {
    issue,
    reissue,
    verify
}

const jwt = {
    issue,
    reissue,
    verify
}

export default jwt;