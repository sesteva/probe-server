const probes = require(".");
const Prometheus = {
	register: {
		contentType: "Something",
		metrics: jest.fn()
	}
};

console.info = jest.fn(() => null);
console.error = jest.fn(() => null);
let processEvents = {};

process.on = jest.fn((signal, cb) => {
	processEvents[signal] = cb;
});

process.kill = jest.fn((pid, signal) => {
	processEvents[signal]();
});

process.exit = jest.fn(number => number);

afterEach(done => {
	process.kill(process.pid, "SIGTERM");
	done();
});

test("creates a probe", () => {
	const probeServer = probes(Prometheus);
	expect(probeServer).toHaveProperty("isServerReady");
	expect(probeServer).toHaveProperty("isServerShuttingDown");
	expect(probeServer).toHaveProperty("registerShutdownHandler");
	expect(probeServer).toHaveProperty("shutdown");
	expect(probeServer).toHaveProperty("signalNotReady");
	expect(probeServer).toHaveProperty("signalReady");
});
