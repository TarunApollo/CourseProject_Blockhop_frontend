/**
 * WebSocket client for anticheat heartbeats
 */

const WS_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL = `${WS_PROTOCOL}://${window.location.hostname}:8080/ws/anti-cheat`;

let socket = null;

/**
 * Opens the anticheat socket for the current level
 *
 * @param {string} levelId the level being played
 * @returns {Promise<void>}
 */
export function connect(levelId) {
  return new Promise((resolve, reject) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    const url = `${WS_URL}/${levelId}`;
    const nextSocket = new WebSocket(url);
    socket = nextSocket;

    nextSocket.onopen = () => {
      resolve();
    };

    nextSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.warn("[anti-cheat]", data.error);
        }
        if (data.violations?.length) {
          console.warn("[anti-cheat]", data.violations, "frame:", data.frame);
        }
      } catch {
        // Non json messages are ignored for now..
      }
    };

    nextSocket.onerror = (err) => {
      if (socket === nextSocket) {
        socket = null;
      }
      reject(err);
    };

    nextSocket.onclose = () => {
      if (socket === nextSocket) {
        socket = null;
      }
    };
  });
}

/**
 * Sends one heartbeat frame
 */
export function sendHeartbeat(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({
    frame: payload.frame,
    player: payload.player,
    gravity: payload.gravity,
  }));
}

/**
 * Closes the anticheat socket
 */
export function disconnect() {
  const currentSocket = socket;
  socket = null;

  if (currentSocket) {
    currentSocket.close();
  }

}
