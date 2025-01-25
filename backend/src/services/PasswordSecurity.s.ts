import bcrypt from 'bcryptjs';


export default class PasswordSecurity {
    public static async hash(password: string) {
        const salt = await bcrypt.genSalt(Math.floor(Math.random() * 2) + 1);
        return await bcrypt.hash(password, salt);
    }
    public static async compare(password: string, hash: string) {
        return await bcrypt.compare(password, hash);
    }
}