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

This repository made for the purpose of learning, and practicing coding.

This applications may have many potential bugs, and I advise you not to use it for commercial or personal purposes, as it hasn't been secured and tested.

## Development

For installation instructions, please use the following ways.

- [Local installation](#local-installation)
- [Docker](#docker)

## Local installation

### Prerequisites

**Node.js (18.x.x+)**

See the [official Node.js installation documentation](https://nodejs.org/).

**Postgresql (15.x.x+)**

See the [official Postgresql installation documentation](https://www.postgresql.org/docs/current/tutorial-install.html).

**Redis (6.x.x+)**

See the [official redis installation documentation](https://redis.io/docs/getting-started/installation/).

### Installation

Clone the repository, and install dependencies.

```bash
$ git clone https://github.com/akiratatsuhisa/first-nestjs-app.git
```

Install Dependencies for web api, open new terminal.

```bash
$ npm install
```

Create an `.env` file and add all below values.

- `PORT` - The port number for runned the server

- `DATABASE_URL` - The main database postgres url
- `REDIS_URL` - The sub database redis url

- `SECRET` - Used for hash jwt token
- `EXPIRES_IN` - Expiration time for jwt token, the unit used is `milliseconds`
- `REFRESH_TOKEN_EXPIRES` - Expiration time for refresh token, the unit used is `milliseconds`
- `REFRESH_TOKEN_SOCKET_OFFSET` - offset timeout for socket.io to request client renew token, the unit used is `milliseconds`
- `REFRESH_TOKEN_WSAUTH_OFFSET` - offset timeout to expires client authenticating, the unit used is `milliseconds`


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

**Docker (20.x.x+)**

See the [official Docker installation documentation](https://docs.docker.com/get-docker/).

### Installation

Clone the repository, and create `.env` files same as [above](#local-installation).

Create an `.env` file in root repository folder and add all below values.


### Running

To run the containers, open terminal at root repository folder and run these **commands**: 

```bash
# Dockerfile hasn't been create
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

Released under the [Released under the MIT license.](LICENSE)
