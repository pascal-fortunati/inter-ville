// Client Socket.io
// - Connexion au backend avec cookies
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const socket = io(SOCKET_URL, { withCredentials: true });

export default socket;
