import bcrypt from "bcrypt";

const saltrounds: number = 10;

interface JsonData {
    long_url: string
}

async function getHash(url:string) {
    const salt: string = await bcrypt.genSalt(saltrounds);
    const hashString: string = await bcrypt.hash(url, salt)
    return hashString.substring(7).substring(22).substring(1,6)
}

const server = Bun.serve({
    port: import.meta.env.PORT,
    hostname: import.meta.env.HOSTNAME,
    async fetch(req) {
        const url = new URL(req.url);
        console.log(req.headers)

        if (url.pathname === '/') {
            return Response.json({ success: true });
        }

        if (req.method === 'POST' && url.pathname === '/api/new') {
            const payload: JsonData = (await req.json()) as JsonData
            console.log(payload.long_url)
            const hashString: String = await getHash(payload.long_url)
            const short_url: String = `http://${url.hostname}:${url.port}/${hashString}`
            console.log(short_url);
            return Response.json({ success: true, payload, short_url: short_url })
        }

        

        return new Response("Page not found.", { status: 404 })
    }
})

console.log(`Listening on ${server.url}`)