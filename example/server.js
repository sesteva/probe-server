const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const Prometheus = require("prom-client");
const probes = require("../index.js");

const port = parseInt(process.env.PORT, 10) || 3000;

const metricsInterval = Prometheus.collectDefaultMetrics();
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
	name: "http_request_duration_ms",
	help: "Duration of HTTP requests in ms",
	labelNames: ["method", "route", "code"],
	buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500] // buckets for response time from 0.1ms to 500ms
});

const probeServer = probes(Prometheus);
const server = express();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
const router = express.Router();

// log only 4xx` and 5xx responses to console
server.use(
	morgan("dev", {
		skip: function(req, res) {
			return res.statusCode < 400;
		}
	})
);

/* 
  Log all to STDOUT using Standard Apache common log output.
  :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
 */
server.use(morgan("common"));

// Runs before each requests
server.use((req, res, next) => {
	res.locals.startEpoch = Date.now();
	next();
});

// ###### - YOUR ROUTES - ######

router.get("/favicon.ico", (req, res) => {
	res.status(204);
});

router.get("/", (req, res) => {
	res.send("Hellow World");
});

router.get("/hello", (req, res) => {
	res.json({ hello: "World" });
});

// ###### - YOUR ROUTES - ######

// Runs after each requests
server.use((req, res, next) => {
	console.log("Request Type:", req.method);
	const responseTimeInMs = Date.now() - res.locals.startEpoch;
	httpRequestDurationMicroseconds
		.labels(req.method, req.url, res.statusCode)
		.observe(responseTimeInMs);
	next();
});

server.use("/", router);

// Graceful shutdown
process.on("SIGTERM", () => {
	clearInterval(metricsInterval);

	server.close(err => {
		if (err) {
			console.error(err);
			process.exit(1);
		}

		process.exit(0);
	});
});

server.listen(port, err => {
	probeServer.signalReady();
	if (err) throw err;
	console.log(`> Ready on http://localhost:${port}`);
});
