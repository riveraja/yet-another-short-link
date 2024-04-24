## How to run tests

```
$ bun shorten.ts
status code: 200
headers: {
  "content-type": "application/json;charset=utf-8",
  date: "Wed, 24 Apr 2024 07:23:30 GMT",
  "content-length": "265",
}
body: {
  success: true,
  status: 200,
  long_url: "https://medium.com/@tdodds/the-wild-story-behind-the-longest-website-url-in-the-world-8a6fd24bc15e",
  short_url: "http://127.0.0.1:8080/xblenb5",
  created_at: "2024-04-24T07:23:31.621Z",
  expires_on: "2024-04-24T07:02:20.878Z",
}
```

```
$ bun rvr.ts
User registration successful!
Created token: eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJyYW5kb211c2VyN2xnaXVyIiwiZW1haWwiOiJ1c2VyZW1haWx4bmoyOWFmQGVtYWlsLmNvbSIsImlhdCI6MTcxMzk1OTAwMCwiaXNzIjoieWFzbC1hcHAiLCJhdWQiOiJ5YXNsLWFwaS1jbGllbnQiLCJleHAiOjE3MTM5NjYyMDB9.u1-Aeo9KyYih8NU3z74P66uC05F4PYm5s1q21wA_tJU
Verification successful!
Waiting for 5000ms before refreshing the token
Token refreshed successfully!
Refreshed token: eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJyYW5kb211c2VyN2xnaXVyIiwiZW1haWwiOiJ1c2VyZW1haWx4bmoyOWFmQGVtYWlsLmNvbSIsImlhdCI6MTcxMzk1OTAwNSwiaXNzIjoieWFzbC1hcHAiLCJhdWQiOiJ5YXNsLWFwaS1jbGllbnQiLCJleHAiOjE3MTM5NjYyMDV9.AGxL9_IMU5NwJvsZuZps-w_aqPzSwmEuncZdBeVyS88
```
