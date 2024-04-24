import { data } from './exports'
import { registerUser } from './register'
import { verify_otp } from './verify'
import { refresh_token } from './refresh'

const requestBody = {
    user_id: data.RandomUserId,
    email: data.RandomEmail
}

interface Register {
    success: boolean,
    activation_code: string,
    token: string
}

interface Body {
    success: boolean,
    status: number,
    token: string
}

const body = await registerUser({ token: data.AdminToken, body: requestBody })

const jsonBody: Register = await body.json() as Register
const verify_status_code = await verify_otp({ jsonBody: jsonBody })

if (verify_status_code === 200) console.log('Verification successful!')

const refresh_result = await refresh_token({ jsonBody: jsonBody })

if (refresh_result.statusCode === 200) {
    console.log('Token refreshed successfully!')
    const body: Body = await refresh_result.body.json() as Body
    console.log('New token:', body.token)
}

