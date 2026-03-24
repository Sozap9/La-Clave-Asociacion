import fetch from 'node-fetch';
(async ()=>{
  try {
    const login = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email:'admin@laclave.com', password:'CAMBIAR_PASSWORD'})
    });
    const loginJson = await login.json();
    console.log('login', login.status, loginJson);
    if (!loginJson.token) return;
    const token = loginJson.token;
    const resp = await fetch('http://localhost:5000/api/admin/socios/1/deactivate', {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({motivo:'Baja administrativa'})
    });
    const data = await resp.json();
    console.log('deactivate', resp.status, data);
  } catch (err) {
    console.error('ERR', err);
  }
})();
