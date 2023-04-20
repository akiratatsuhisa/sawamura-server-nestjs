# Nestjs App

![license](https://img.shields.io/badge/License-MIT-green.svg)
![version](https://img.shields.io/badge/version-0.0.1%20alpha-brightgreen.svg)
![state](https://img.shields.io/badge/state-ongoing-blue.svg)
![test](https://img.shields.io/badge/bug-crit-red.svg)

#### Table of Contents

- [About](#about)
- [Development](#development)

  - [Local installation](#local-installation)
  - [Docker](#docker)

- [Support](#support)
- [License](#license)

## About

This repository is intended for learning and practicing coding. However, please note that this application may contain bugs, and I advise against using it for commercial or personal purposes, as it has not been secured and tested.

The project utilizes a web UI from [vuetify-app](https://github.com/akiratatsuhisa/vuetify-app).

This back-end app is modeled after Facebook's messenger and offers a variety of features to facilitate communication between users. It supports both one-on-one and group chats, and users can customize their chat rooms by changing the chat room's image and chat name. Group chat's member have additional control over the chat, including the ability to invite or remove members, update member roles, and change nicknames. Furthermore, the app enables users to share files by allowing uploads and downloads within chat conversations. With these features, users can easily communicate and share information with friends.

## Development

For installation instructions, please use the following ways.

- [Local installation](#local-installation)
- [Docker](#docker)

## Local installation

### Prerequisites

**Node.js (v18 or higher)**

See the [official Node.js installation documentation](https://nodejs.org/).

**Postgresql (v15 or higher)**

See the [official Postgresql installation documentation](https://www.postgresql.org/docs/current/tutorial-install.html).

**Redis (v6 or higher)**

See the [official redis installation documentation](https://redis.io/docs/getting-started/installation/).

### Installation

To install the application, clone the repository and install the required dependencies:

```bash
$ git clone https://github.com/akiratatsuhisa/first-nestjs-app.git
```

Install Dependencies for server app, open new terminal.

```bash
$ npm install
```

Next, create an `.env` file with the following contents:

| KEY                         | DESCRIPTION                                                                                                                                                                                                                                                                  | EXAMPLE VALUE                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| PORT                        | The port number that the server will be running on.                                                                                                                                                                                                                          | 4000                                                        |
| SECRET                      | A secret key used to sign and verify JWT token.                                                                                                                                                                                                                              | S3cr4t                                                      |
| EXPIRES_IN                  | The time period for which an access token (jwt token) is valid.                                                                                                                                                                                                              | 5m                                                          |
| REFRESH_TOKEN_EXPIRES       | The time period for which a refresh token is valid, in seconds.                                                                                                                                                                                                              | 1800                                                        |
| REFRESH_TOKEN_SOCKET_OFFSET | The time offset in milliseconds to renew refresh token via Socket.IO, based on the remaining expiration time of the access token. The server will emit a request to the client to send a new token when the remaining time of the access token reaches the specified offset. | 60000                                                       |
| REFRESH_TOKEN_WSAUTH_OFFSET | The time in milliseconds to wait for the client to send the latest token back to the server using the Authorization header. If the server does not receive any response from the client within this period, it will disconnect the socket client from the socket.io server.  | 1500                                                        |
| DATABASE_URL                | The URL to connect to the PostgreSQL database.                                                                                                                                                                                                                               | postgresql://username:password@host:port/name?schema=public |
| REDIS_URL                   | The URL to connect to Redis cache database.                                                                                                                                                                                                                                  | redis://host:port/                                          |
| SENDGRID_SENDER             | The email address used as the sender of SendGrid emails.                                                                                                                                                                                                                     | example@example.com                                         |
| SENDGRID_API_KEY            | The API key used to authenticate with SendGrid.                                                                                                                                                                                                                              |                                                             |
| DROPBOX_CLIENT_ID           | The client ID used to authenticate with the Dropbox API.                                                                                                                                                                                                                     |                                                             |
| DROPBOX_CLIENT_SECRET       | The client secret used to authenticate with the Dropbox API.                                                                                                                                                                                                                 |                                                             |
| DROPBOX_REFRESH_TOKEN       | The refresh token used to authenticate with the Dropbox API.                                                                                                                                                                                                                 |                                                             |
| RESET_PASSWORD_URL          | The URL used for resetting the user's password.                                                                                                                                                                                                                              | "http://localhost:3000/resetPassword                        |

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Docker

### Prerequisites

**Docker (v20 or higher)**

Please see the [official Docker installation documentation](https://docs.docker.com/get-docker/) for installation instructions.

### Installation

To install the application using Docker, clone the repository and create an .env file with the same contents as for [Local Installation](#local-installation).

### Running

To run the application in a Docker container, use the following commands:

```bash
# Dockerfile hasn't been create
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

This application is released under the [MIT license](LICENSE).
