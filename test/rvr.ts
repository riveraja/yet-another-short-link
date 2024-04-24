import { data } from './exports'
import { registerUser } from './register'
import { verify_otp } from './verify'
import { refresh_token } from './refresh'

const TIMEOUT = 5000

const requestBody = {
    user_id: data.RandomUserId,
    email: data.RandomEmail
}

interface Register {
    success: boolean,
    activation_code: string,
    token: string
}

const body = await registerUser({ token: data.AdminToken, body: requestBody })

const jsonBody: Register = await body.json() as Register
console.log('Created token:', jsonBody.token)

await verify_otp({ jsonBody: jsonBody })

console.log(`Waiting for ${TIMEOUT}ms before refreshing the token`)

setTimeout(async function() {
    await refresh_token({ jsonBody: jsonBody })
}, TIMEOUT)
