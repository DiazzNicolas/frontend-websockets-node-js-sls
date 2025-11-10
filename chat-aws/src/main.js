const WEBSOCKET_URL = "wss://ql8to9jft0.execute-api.us-east-1.amazonaws.com/dev";
const API_URL = "https://4nzr00pnd5.execute-api.us-east-1.amazonaws.com/usuario/crear";

let ws = null;
let usuario = null;

const nombreInput = document.getElementById("nombre");
const crearBtn = document.getElementById("crearUsuario");
const chatSection = document.getElementById("chatSection");
const userSection = document.getElementById("userSection");
const mensajesDiv = document.getElementById("mensajes");
const mensajeInput = document.getElementById("mensaje");
const enviarBtn = document.getElementById("enviar");
const estado = document.getElementById("estado");

// ==========================
// Crear usuario
// ==========================
crearBtn.addEventListener("click", async () => {
  const nombre = nombreInput.value.trim();
  if (!nombre) {
    alert("Por favor ingresa un nombre");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });

    const data = await res.json();
    usuario = data.user;

    console.log("Usuario creado:", usuario);

    userSection.style.display = "none";
    chatSection.style.display = "block";

    conectarWebSocket();
  } catch (error) {
    console.error("Error al crear usuario:", error);
    alert("Error creando usuario");
  }
});

// ==========================
// Conectar al WebSocket
// ==========================
function conectarWebSocket() {
  ws = new WebSocket(WEBSOCKET_URL);

  ws.onopen = () => {
    estado.textContent = "🟢 Conectado al servidor";
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    mostrarMensaje(data.usuario || "Anónimo", data.mensaje);
  };

  ws.onclose = () => {
    estado.textContent = "🔴 Desconectado, reconectando...";
    setTimeout(conectarWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error("Error WebSocket:", err);
  };
}

// ==========================
// Enviar mensajes
// ==========================
enviarBtn.addEventListener("click", () => {
  const mensaje = mensajeInput.value.trim();
  if (!mensaje || !usuario) return;

  const payload = {
    action: "sendMessage",
    mensaje,
    usuario: usuario.nombre,
  };

  ws.send(JSON.stringify(payload));
  mensajeInput.value = "";
});

function mostrarMensaje(user, msg) {
  const div = document.createElement("div");
  div.className = "mensaje";
  div.textContent = `${user}: ${msg}`;
  mensajesDiv.appendChild(div);
  mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
}
