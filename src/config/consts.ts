// Chat Options:
export const KICK_SILENT_MS = 5 * 60 * 1000; // 5 minutes

// Chat Broadcast Messages:
export const BROADCAST_JOINED_MESSAGE = (nickname: string) => `${nickname} joined the chat`;
export const BROADCAST_KICK_MESSAGE = (nickname: string) => `${nickname} was disconnected due to inactivity`;
export const BROADCAST_DISCONNECTED_MESSAGE = (nickname: string) => `${nickname} left the chat, connection lost`;

// Chat Member Messages:
export const NICKNAME_TAKEN = 'Failed to connect. Nickname already taken';
export const KICKED_MESSAGE = 'Disconnected by the server due to inactivity';
export const KICKED_NO_AUTH_MESSAGE = 'Disconnected by the server due to unauthorised request';

// Chat Socket To Receive Events:
export const EVENT_JOIN = 'join';
export const EVENT_LEAVE = 'leave';
export const EVENT_RECEIVE_MESSAGE = 'message';

// Chat Socket To Emit Events:
export const EVENT_JOIN_SUCCESSFUL = 'joinSuccess';
export const EVENT_JOIN_FAIL = 'joinFail';
export const EVENT_EMIT_MESSAGE = 'message';
export const EVENT_KICK = 'kick';
