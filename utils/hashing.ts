// import bcrypt from "bcrypt";
import { getHashDuplicates } from "./urls";

const saltrounds: number = 10;

// export const createPasswordHash = async (password: string) => {
//     return await Bun.password.hash(password, {
//         algorithm: 'bcrypt',
//         cost: 4
//     })
// }

// export const verifyPasswordHash = async (password: string, hashedPassword: string) => {
//     return await Bun.password.verify(password, hashedPassword)
// }

const generate_string = async (n: number) => {
    return (Math.random() + 1).toString(36).substring(n);
}

export const getHash = async () => {
    // const salt: string = await bcrypt.genSalt(saltrounds);
    // const hashString: string = await bcrypt.hash(url, salt)
    // return hashString.substring(7).substring(22).substring(1,6)
    const hashString: string = await generate_string(7)
    if (Object((await getHashDuplicates({ hashString }))).length === 1) {
        return await generate_string(6)
    } else {
        return hashString
    }
}

export const genRandString = async () => {
    return await generate_string(7)
}