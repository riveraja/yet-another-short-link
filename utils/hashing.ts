
export const createPasswordHash = async (password: string) => {
    const hashedPassword: string = await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 4
    })
    return hashedPassword
}

export const verifyPasswordHash = async (password: string, hashedPassword: string) => {
    const isMatch: boolean = await Bun.password.verify(password, hashedPassword)
    return isMatch
}