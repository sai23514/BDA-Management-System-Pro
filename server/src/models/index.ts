/**
 * Import every model for its side-effect of registering the schema with Mongoose.
 * Importing this module once at startup guarantees that populate() calls referencing
 * any model (e.g. 'Team') work regardless of which controller ran first.
 */
import './User.js';
import './Team.js';
import './Lead.js';
import './Client.js';
import './Activity.js';
import './Notification.js';
import './Conversation.js';
import './Message.js';

export { default as User } from './User.js';
export { default as Team } from './Team.js';
export { default as Lead } from './Lead.js';
export { default as Client } from './Client.js';
export { default as Activity } from './Activity.js';
export { default as Notification } from './Notification.js';
export { default as Conversation } from './Conversation.js';
export { default as Message } from './Message.js';
