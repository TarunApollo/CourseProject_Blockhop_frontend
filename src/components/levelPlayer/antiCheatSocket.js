/**
 * WebSocket client for anticheat heartbeats
 */

const WS_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL = `${WS_PROTOCOL}://${window.location.hostname}:8080/ws/anti-cheat`;

let socket = null;
let onConnectCallback = null;

/**
 * Register a callback to fire when the socket connects.
 * Used by the game loop to reset its frame counter so the
 * first heartbeat always sends frame=1.
 *
 * @param {() => void} cb
 */
export function onConnect(cb) {
  onConnectCallback = cb;
}

/**
 * Opens the anticheat socket for the current level
 *
 * @param {string} levelId the level being played
 * @returns {Promise<void>}
 */
export function connect(levelId) {
  return new Promise((resolve, reject) => {
    // Always disconnect any existing socket before opening a new one.
    // Without this, navigating to a new level while the old socket is
    // still open reuses the stale connection and the server-side frame
    // counter is out of sync.
    if (socket) {
      const old = socket;
      socket = null;
      if (old.readyState === WebSocket.OPEN || old.readyState === WebSocket.CONNECTING) {
        old.close();
      }
    }

    const url = `${WS_URL}/${levelId}`;
    const nextSocket = new WebSocket(url);
    socket = nextSocket;

    nextSocket.onopen = () => {
      if (onConnectCallback) {
        onConnectCallback();
      }
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
  }));
}

/**
 * Closes the anticheat socket
 */
export function disconnect() {
  const currentSocket = socket;
  socket = null;
  onConnectCallback = null;

  if (currentSocket) {
    currentSocket.close();
  }

}