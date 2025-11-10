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
      body: JSON.stringify({ username: nombre }), // ← Cambié "nombre" por "username"
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    // ← La respuesta del Lambda es { userId, username }
    usuario = {
      userId: data.userId,
      nombre: data.username
    };

    console.log("Usuario creado:", usuario);

    userSection.style.display = "none";
    chatSection.style.display = "block";

    conectarWebSocket();
  } catch (error) {
    console.error("Error al crear usuario:", error);
    alert("Error creando usuario. Revisa la consola.");
  }
});

// ==========================
// Conectar al WebSocket
// ==========================
function conectarWebSocket() {
  ws = new WebSocket(WEBSOCKET_URL);

  ws.onopen = () => {
    estado.textContent = "🟢 Conectado al servidor";
    console.log("WebSocket conectado");
  };

  ws.onmessage = (event) => {
    console.log("Mensaje recibido:", event.data);
    try {
      const data = JSON.parse(event.data);
      mostrarMensaje(data.usuario || "Anónimo", data.mensaje);
    } catch (error) {
      console.error("Error parseando mensaje:", error);
    }
  };

  ws.onclose = () => {
    estado.textContent = "🔴 Desconectado, reconectando...";
    console.log("WebSocket desconectado");
    setTimeout(conectarWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error("Error WebSocket:", err);
    estado.textContent = "❌ Error de conexión";
  };
}

// ==========================
// Enviar mensajes
// ==========================
enviarBtn.addEventListener("click", enviarMensaje);

mensajeInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    enviarMensaje();
  }
});

function enviarMensaje() {
  const mensaje = mensajeInput.value.trim();
  if (!mensaje || !usuario || !ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("No se puede enviar: ", { mensaje, usuario, wsState: ws?.readyState });
    return;
  }

  const payload = {
    action: "sendMessage",
    mensaje,
    usuario: usuario.nombre,
    userId: usuario.userId
  };

  console.log("Enviando mensaje:", payload);
  ws.send(JSON.stringify(payload));
  mensajeInput.value = "";
}

function mostrarMensaje(user, msg) {
  const div = document.createElement("div");
  div.className = "mensaje";
  div.innerHTML = `<strong>${user}:</strong> ${msg}`;
  mensajesDiv.appendChild(div);
  mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
}