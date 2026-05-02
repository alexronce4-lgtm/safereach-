export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { contacts, message } = req.body
  if (!contacts?.length || !message) return res.status(400).json({ error: 'missing params' })

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env
  if (!TWILIO_ACCOUNT_SID) return res.status(500).json({ error: 'Twilio not configured' })

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

  const results = await Promise.allSettled(
    contacts.map(async (c) => {
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: TWILIO_FROM_NUMBER, To: c.phone, Body: message }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.message || r.status)
      return { name: c.name, sid: data.sid }
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  const failed = results.filter(r => r.status === 'rejected').map(r => r.reason?.message)
  res.json({ sent, failed })
}
