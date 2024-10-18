import { DurableObject } from 'cloudflare:workers';

export class MyDurableObject extends DurableObject {
	// Keep track of all WebSocket connections
	session: Map<WebSocket, any>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.session = new Map();
		// Restore the most recent sessions. Useful when the DO is hibernating
		this.ctx.getWebSockets().forEach((ws) => {
			this.session.set(ws, { ...ws.deserializeAttachment() });
		});
	}

	async fetch(request: Request): Promise<Response> {
		// Creates two ends of a WebSocket connection.
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		// Using hibernation https://developers.cloudflare.com/durable-objects/api/websockets/#websocket-hibernation-api
		this.ctx.acceptWebSocket(server);

		this.session.set(server, {});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	webSocketMessage(ws: WebSocket, message: string) {
		// Check how many WebSocket connections are open
		if (this.session.size > 2) {
			this.broadcast(ws, {
				type: 'full',
				message: 'Room is full',
			});
			// if more than 2, close the connection
			ws.close(1000, 'Room is full');
			return;
		}

		const session = this.session.get(ws);
		if (!session.id) {
			session.id = crypto.randomUUID();
			ws.serializeAttachment({ ...ws.deserializeAttachment(), id: session.id });
		}

		this.broadcast(ws, JSON.parse(message));
	}

	private broadcast(sender: WebSocket, message: { type: string; [key: string]: any }) {
		const { type } = message;

		// Check the message type
		if (type === 'join') {
			const id = this.session.get(sender).id;

			// Set X or O
			const player = this.session.size === 1 ? 'X' : 'O';

			// Check the size of the session
			if (this.session.size === 2) {
				// Assign the player to the session
				sender.send(
					JSON.stringify({
						type: 'join',
						message: 'Welcome to the room',
						senderId: id,
						player,
					})
				);
				// Start the game since there are two players
				this.ctx.getWebSockets().forEach((ws) => {
					ws.send(
						JSON.stringify({
							type: 'start',
							message: 'Start game',
						})
					);
				});
			} else {
				// If only one player, send a message to the player
				sender.send(
					JSON.stringify({
						type: 'join',
						message: 'Welcome to the room',
						senderId: id,
						player,
					})
				);
			}
		} else if (type === 'full') {
			// if the room is full, send a message to the player
			sender.send(JSON.stringify(message));
		} else if (type === 'move') {
			// Send the updated board to all players
			this.ctx.getWebSockets().forEach((ws) => {
				ws.send(JSON.stringify(message));
			});
		} else if (type === 'restart') {
			// Restart the game for all players
			this.ctx.getWebSockets().forEach((ws) => {
				ws.send(JSON.stringify(message));
			});
		}
	}
	webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		ws.close(code, 'Durable Object is closing WebSocket');
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		let roomCode: string = '';
		const url = new URL(request.url);
		const path = url.pathname;
		if (path === '/api') {
			const { roomCode: code } = (await request.json()) as { roomCode: string };
			roomCode = code;
			return new Response('');
		} else if (path === '/websocket') {
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				return new Response('Durable Object expected Upgrade: websocket', { status: 426 });
			}
			const room = env.MY_DURABLE_OBJECT.idFromName(roomCode);
			let stub = env.MY_DURABLE_OBJECT.get(room);
			return stub.fetch(request);
		}
		return new Response('Hello, world!');
	},
} satisfies ExportedHandler<Env>;
