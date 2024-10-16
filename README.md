# Cloudflare Multi-player Tic Tac Toe Game

This repository is a companion to the [DevTools & DevCools: Cloudflare Edition](https://youtube.com/live/KTAIN2RAa8E) livestream. If you missed the stream or want to catch it again, [you can watch it here!](https://youtube.com/live/KTAIN2RAa8E).

[![IMAGE ALT TEXT](http://img.youtube.com/vi/KTAIN2RAa8E/0.jpg)](http://www.youtube.com/watch?v=KTAIN2RAa8E 'Diving into Durable Objects with Harshil Agrawal from Cloudflare | DevTools & DevCools')

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Game Flow](#game-flow)
5. [Setup and Deployment](#setup-and-deployment)
6. [Contributing](#contributing)
7. [License](#license)

## Project Overview

In this project, we built a multiplayer Tic Tac Toe game using Cloudflare Workers and Durable Objects to manage game state across clients. Players can create or join a room and play Tic Tac Toe in real-time, with game data synchronized between the players through WebSocket communication.

## Features

- **Real-Time Multiplayer:** Players can create or join rooms and play Tic Tac Toe in real time.
- **Durable Game State:** Game state is persisted and synchronized using Cloudflare Durable Objects.
- **WebSocket Communication:** WebSocket is used for efficient real-time communication between clients.
- **Responsive UI:** Built with Tailwind CSS for a simple and responsive interface.

## Tech Stack

- **Cloudflare Workers:** These are serverless functions that run on Cloudflare's global network. In this project, they serve as the backend, handling requests to create or join game rooms and managing real-time communication via WebSockets.

- **Durable Objects:** These are stateful objects that allow data to be persisted and synchronized across clients. In this project, each game room has its own Durable Object instance, which stores the game state (board, player turns) and ensures it stays consistent between players in real time.

## Game Flow

1. **Create or Join Room:**

   - A player can create a new room, generating a unique room code.
   - Another player can join the room using the room code.

2. **Game Start:**

   - Once both players are in the room, the game board becomes visible, and the game starts.

3. **Gameplay:**

   - Players take turns marking cells on the board (X and O).
   - The game detects win conditions and displays the result (win or draw).

4. **Restart Game:**

   - A "Restart" button allows players to reset the game board and start a new round.

## Setup and Deployment

To deploy this project, follow these steps:

### Prerequisites

- Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/get-started/) CLI to manage Cloudflare Workers.
- A Cloudflare account with Workers and Durable Objects enabled.

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/DevCycleHQ-Sandbox/cloudflare-tictactoe.git
   cd cloudflare-tictactoe
   ```

2. **Install dependencies:**

   Install the necessary dependencies by running:

   ```bash
   npm install
   ```

3. **Configure Wrangler:**

   Ensure your `wrangler.toml` is set up correctly for Durable Objects, assets, and other configurations (this is provided in the repository).

4. **Run the project locally:**

   Start the development server:

   ```bash
   npm run dev
   ```

   This will run the Workers project locally, allowing you to test the application at `http://localhost:8787/`.

5. **Deploy to Cloudflare Workers:**

   Once you're ready to deploy, use:

   ```bash
   npm run deploy
   ```

   This will push your code to Cloudflare and make it available at your worker's URL.

## Contributing

Contributions are welcome! If you would like to contribute to this project, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
