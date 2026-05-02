import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env

app.post('/api/alert', async (req, res) => {
  const { contacts, message } = req.body

  if (!contacts?.length || !message) {
    return res.status(400).json({ error: 'contacts and message required' })
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return res.status(500).json({ error: 'Twilio not configured' })
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

  const results = await Promise.allSettled(
    contacts.map(async (c) => {
      const body = new URLSearchParams({
        From: TWILIO_FROM_NUMBER,
        To: c.phone,
        Body: message,
      })
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.message || r.status)
      return { name: c.name, sid: data.sid }
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  const failed = results.filter(r => r.status === 'rejected').map(r => r.reason?.message)

  console.log('Alerts sent:', sent)
  if (failed.length) console.error('Failed:', failed)

  res.json({ sent, failed })
})

app.listen(3001, () => console.log('SafeReach alert server running on :3001'))
