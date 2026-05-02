export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).end()

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req.body),
  })

  const data = await resp.json()
  return res.status(resp.status).json(data)
}
