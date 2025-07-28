const http = require('http')

const data = JSON.stringify({
  voiceCommand: "промени потребител мария маринова",
  email: "maria@mail.com"
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/voice-commands',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}

const req = http.request(options, (res) => {
  let responseData = ''
  
  res.on('data', (chunk) => {
    responseData += chunk
  })
  
  res.on('end', () => {
    console.log('Response:', responseData)
    try {
      const parsed = JSON.parse(responseData)
      console.log('Parsed response:', JSON.stringify(parsed, null, 2))
    } catch (e) {
      console.log('Error parsing response:', e)
    }
  })
})

req.on('error', (e) => {
  console.error('Request error:', e)
})

console.log('Sending command:', data)
req.write(data)
req.end() 