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
		if (this.ctx.getWebSockets().length > 2) {
			this.broadcast(ws, {
				type: 'full',
				message: 'Room is full',
			});
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

	private broadcast(ws: WebSocket, message: object) {
		const { type } = message;
		if (type === 'join') {
			const id = this.session.get(ws).id;
			ws.send(
				JSON.stringify({
					type: 'join',
					message: 'Welcome to the room',
					senderId: id,
				})
			);
		} else if (type === 'full') {
			ws.send(JSON.stringify(message));
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
