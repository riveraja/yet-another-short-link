import { request } from 'undici'
import { data } from './exports'

const apiEndpoint = '/api/shorten-url'
const postUrl = `http://${data.Hostname}:${data.Port}${apiEndpoint}`

const requestBody = {
    long_url: data.LongUrl,
    expire_time_hours: data.ExpireTime
}

const {
    statusCode,
    headers,
    body
} = await request(postUrl, {
    method: 'POST',
    headers: {
        'content-type': 'application/json'
    },
    body: JSON.stringify(requestBody)
})

const jsonData = await body.json()
console.log('status code:', statusCode)
console.log('headers:', headers)
console.log('body:', jsonData)
