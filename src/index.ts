/**
 * MedReconcile MCP — Main Server Entry Point
 * 
 * SHARP-on-MCP compliant medication reconciliation MCP server.
 * Exposes 7 tools for AI-powered medication analysis via Streamable HTTP transport.
 * 
 * @see https://sharponmcp.com
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import type { Request, Response } from "express";
import { randomUUID } from "crypto";

import { config } from "./config.js";
import { logger } from "./logger.js";
import { DataProvider } from "./fhir/dataProvider.js";
import { extractSharpContext, setCurrentContext } from "./middleware/sharpContext.js";
import { authenticateRequest } from "./middleware/auth.js";
import { registerTools } from "./tools/index.js";

/** Create a fresh MCP server instance with tools registered */
function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "medreconcile-mcp", version: "1.0.0" },
    { 
      capabilities: { 
        tools: {},
        experimental: {
          "ai.promptopinion/fhir-context": {}
        }
      } 
    },
  );
  const dp = new DataProvider();
  registerTools(server, dp);
  return server;
}

// --- Express HTTP Server ---
const app = express();
app.use(express.json());

// Store transports by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    server: "medreconcile-mcp",
    version: "1.0.0",
    mode: config.mode,
    dryRun: config.dryRun,
    sharp: { fhir_context_required: true, specification: "https://sharponmcp.com" },
  });
});

// MCP endpoint — Streamable HTTP
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    // Authentication
    if (!authenticateRequest(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Extract SHARP context
    const sharpCtx = extractSharpContext(req);
    setCurrentContext(sharpCtx);

    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      // Existing session
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New session — create fresh server + transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport);
          logger.info("MCP session initialized", { sessionId: id });
        },
      });

      transport.onclose = () => {
        const sid = Array.from(transports.entries()).find(([, t]) => t === transport)?.[0];
        if (sid) transports.delete(sid);
        logger.info("MCP session closed");
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } else {
      res.status(400).json({ error: "No valid session. Send an initialize request first." });
    }
  } catch (err: any) {
    logger.error("MCP request error", { error: err.message });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "No active session." });
    return;
  }
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    transports.delete(sessionId);
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

function isInitializeRequest(body: any): boolean {
  if (Array.isArray(body)) {
    return body.some((msg: any) => msg.method === "initialize");
  }
  return body?.method === "initialize";
}

// --- Start server ---
app.listen(config.port, () => {
  logger.info(`MedReconcile MCP server started`, {
    port: config.port, mode: config.mode, dryRun: config.dryRun,
    endpoint: `http://localhost:${config.port}/mcp`,
  });
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🏥 MedReconcile MCP Server v1.0.0                         ║
║  SHARP-on-MCP Compliant Medication Reconciliation           ║
╠══════════════════════════════════════════════════════════════╣
║  Mode:     ${config.mode.padEnd(48)}║
║  DRY_RUN:  ${String(config.dryRun).padEnd(48)}║
║  MCP:      http://localhost:${config.port}/mcp${" ".repeat(Math.max(0, 30 - String(config.port).length))}║
║  Health:   http://localhost:${config.port}/health${" ".repeat(Math.max(0, 27 - String(config.port).length))}║
╠══════════════════════════════════════════════════════════════╣
║  Test: npx @modelcontextprotocol/inspector \\                ║
║        http://localhost:${config.port}/mcp${" ".repeat(Math.max(0, 34 - String(config.port).length))}║
╚══════════════════════════════════════════════════════════════╝
  `);
});
