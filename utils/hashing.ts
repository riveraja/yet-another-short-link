import bcrypt from "bcrypt";

const saltrounds: number = 10;

export const createPasswordHash = async (password: string) => {
    return await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 4
    })
}

export const verifyPasswordHash = async (password: string, hashedPassword: string) => {
    return await Bun.password.verify(password, hashedPassword)
}

export const getHash = async (url: string) => {
    const salt: string = await bcrypt.genSalt(saltrounds);
    const hashString: string = await bcrypt.hash(url, salt)
    return hashString.substring(7).substring(22).substring(1,6)
}

export const genRandString = async () => {
    return (Math.random() + 1).toString(36).substring(7);
}