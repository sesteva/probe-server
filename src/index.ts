import express = require("express");
import morgan = require("morgan");
import { Server } from "http";

const IS_READY = "IS_READY";
const IS_NOT_READY = "IS_NOT_READY";
const IS_SHUTTING_DOWN = "IS_SHUTTING_DOWN";
const IS_NOT_SHUTTING_DOWN = "IS_NOT_SHUTTING_DOWN";

let server: Server;

const port = process.env.PROBE_PORT || 9000;
let isReady = false;
let isShuttingDown = false;

type Prometheus = { register: { contentType: any; metrics: () => void } };

export = function(appName: string, Prometheus: Prometheus) {
	const app: express.Application = express();

	/* 
  Log all to STDOUT using Standard Apache common log output.
  :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
 */

	app.use(morgan("common"));

	app.get("/metrics", (req, res) => {
		res.set("Content-Type", Prometheus.register.contentType);
		res.end(Prometheus.register.metrics());
	});

	app.get("/healthz/liveness", (req, res) => {
		if (isShuttingDown) {
			res.status(500).send(`${appName} ${IS_SHUTTING_DOWN}`);
		} else {
			res.send(`${appName} ${IS_NOT_SHUTTING_DOWN}`);
		}
	});

	app.get("/healthz/readiness", (req, res) => {
		if (isReady) {
			res.send(`${appName} ${IS_READY}`);
		} else {
			res.status(500).send(`${appName} ${IS_NOT_READY}`);
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

	server = app.listen(port, (err?: Error) => {
		if (err) throw err;
		console.info(`> Ready on http://localhost:${port}`);
	});

	return {
		isReady: () => {
			return isReady;
		},
		isShuttingDown: () => {
			return isShuttingDown;
		},
		emitNotReady: () => {
			isReady = false;
		},
		emitReady: () => {
			isReady = true;
		},
		emitShutdown: async () => {
			isReady = false;
			isShuttingDown = true;
		},
		server
	};
};
