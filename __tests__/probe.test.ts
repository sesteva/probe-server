import probes = require("../src");
import request = require("supertest");

const Prometheus = {
	register: {
		contentType: "application/text",
		metrics: () => "some metrics"
	}
};

console.info = jest.fn(() => null);
console.error = jest.fn(() => null);

let processEvents: any = {};
// @ts-ignore
process.on = jest.fn((signal: string, cb) => {
	processEvents[signal!] = cb;
});

process.kill = jest.fn((pid, signal: string) => {
	processEvents[signal!]();
});

// @ts-ignore
process.exit = jest.fn(number => number);

const probeServer = probes("mytest", Prometheus);
const app = probeServer.server;
afterEach(done => {
	process.kill(process.pid, "SIGTERM");
	done();
});

test("creates a probe", () => {
	expect(probeServer).toHaveProperty("isReady");
	expect(probeServer).toHaveProperty("isShuttingDown");
	expect(probeServer).toHaveProperty("emitShutdown");
	expect(probeServer).toHaveProperty("emitNotReady");
	expect(probeServer).toHaveProperty("emitReady");
});

describe("GET /metrics", () => {
	it("returns metrics", async () => {
		const response = await request(app).get("/metrics");
		expect(response.text).toBe("some metrics");
		expect(response.status).toBe(200);
	});
});
describe("GET /healthz", () => {
	test("/liveness", async () => {
		const response = await request(app).get("/healthz/liveness");
		expect(response.text).toEqual("mytest IS_NOT_SHUTTING_DOWN");
		expect(response.status).toBe(200);
	});

	test("/liveness 500", async () => {
		probeServer.emitShutdown();
		const response = await request(app).get("/healthz/liveness");
		expect(response.text).toEqual("mytest IS_SHUTTING_DOWN");
		expect(response.status);
	});

	test("/readiness 500", async () => {
		const response = await request(app).get("/healthz/readiness");
		expect(response.text).toEqual("mytest IS_NOT_READY");
		expect(response.status).toBe(500);
	});

	test("/readiness 200", async () => {
		probeServer.emitReady();
		const response = await request(app).get("/healthz/readiness");
		expect(response.text).toEqual("mytest IS_READY");
		expect(response.status).toBe(200);
	});
});
