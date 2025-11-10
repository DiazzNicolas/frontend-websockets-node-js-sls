
const WS_URL = "wss://ql8to9jft0.execute-api.us-east-1.amazonaws.com/dev"; // 👈 tu endpoint
const ws = new WebSocket(WS_URL);

const mensajesDiv = document.getElementById("mensajes");
const nombreInput = document.getElementById("nombre");
const mensajeInput = document.getElementById("mensaje");
const enviarBtn = document.getElementById("enviarBtn");

ws.onopen = () => {
  console.log("✅ Conectado al WebSocket");
  const p = document.createElement("p");
  p.textContent = "Conectado al servidor";
  mensajesDiv.appendChild(p);
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const p = document.createElement("p");
  p.innerHTML = `<strong>${data.nombre}</strong>: ${data.mensaje}`;
  mensajesDiv.appendChild(p);
  mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
};

ws.onclose = () => {
  console.log("❌ Desconectado del WebSocket");
  const p = document.createElement("p");
  p.textContent = "Desconectado del servidor";
  mensajesDiv.appendChild(p);
};

enviarBtn.onclick = () => {
  const nombre = nombreInput.value.trim() || "Anónimo";
  const mensaje = mensajeInput.value.trim();
  if (mensaje === "") return;

  ws.send(JSON.stringify({ nombre, mensaje }));
  mensajeInput.value = "";
};
