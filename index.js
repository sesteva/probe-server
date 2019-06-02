const express = require("express");
const morgan = require("morgan");

const SERVER_IS_NOT_READY = "SERVER_IS_NOT_READY";
const SERVER_IS_NOT_SHUTTING_DOWN = "SERVER_IS_NOT_SHUTTING_DOWN";
const SERVER_IS_READY = "SERVER_IS_READY";
const SERVER_IS_SHUTTING_DOWN = "SERVER_IS_SHUTTING_DOWN";
let server;
const constants = Object.freeze({
	SERVER_IS_NOT_READY,
	SERVER_IS_NOT_SHUTTING_DOWN,
	SERVER_IS_READY,
	SERVER_IS_SHUTTING_DOWN
});

const port = parseInt(process.env.PROBE_PORT, 10) || 9000;
let serverIsReady = false;
let serverIsShuttingDown = false;

module.exports = function(Prometheus) {
	const app = express();
	/* 
  Log all to STDOUT using Standard Apache common log output.
  :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
 */
	app.use(morgan("common"));

	app.get("/metrics", (req, res) => {
		res.set("Content-Type", Prometheus.register.contentType);
		res.end(Prometheus.register.metrics());
	});

	app.get("/health", (req, res) => {
		if (serverIsShuttingDown) {
			res.status(500).send(SERVER_IS_SHUTTING_DOWN);
		} else if (serverIsReady) {
			res.send(SERVER_IS_READY);
		} else {
			res.status(500).send(SERVER_IS_NOT_READY);
		}
	});

	app.get("/live", (req, res) => {
		if (serverIsShuttingDown) {
			res.status(500).send(SERVER_IS_SHUTTING_DOWN);
		} else {
			res.send(SERVER_IS_NOT_SHUTTING_DOWN);
		}
	});

	app.get("/ready", (req, res) => {
		if (serverIsReady) {
			res.send(SERVER_IS_READY);
		} else {
			res.status(500).send(SERVER_IS_NOT_READY);
		}
	});

	// Graceful shutdown
	process.on("SIGTERM", () => {
		server &&
			server.close(err => {
				if (err) {
					console.error(err);
					process.exit(1);
				}
				process.exit(0);
			});
	});

	server = app.listen(port, err => {
		if (err) throw err;
		console.info(`> Ready on http://localhost:${port}`);
	});

	return {
		isServerReady: () => {
			return serverIsReady;
		},
		isServerShuttingDown: () => {
			return serverIsShuttingDown;
		},
		registerShutdownHandler: () => {},
		shutdown: async () => {
			serverIsReady = false;
			serverIsShuttingDown = true;
		},
		signalNotReady: () => {
			serverIsReady = false;
		},
		signalReady: () => {
			serverIsReady = true;
		}
	};
};
