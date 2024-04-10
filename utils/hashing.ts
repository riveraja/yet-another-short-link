
export const createPasswordHash = async (password: string) => {
    return await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 4
    })
}

export const verifyPasswordHash = async (password: string, hashedPassword: string) => {
    return await Bun.password.verify(password, hashedPassword)
}