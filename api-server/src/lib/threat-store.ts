import { Response } from "express";

export interface ThreatLogEntry {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  severity: "low" | "medium" | "high" | "critical";
  threats: { type?: string; severity?: string; detail?: string }[];
  sources: string[];
  userAgent: string;
  blocked: boolean;
}

const MAX_LOG_SIZE = 1000;

export const threatLog: ThreatLogEntry[] = [];

const sseClients = new Set<Response>();

export function addSseClient(res: Response) {
  sseClients.add(res);
}

export function removeSseClient(res: Response) {
  sseClients.delete(res);
}

export function pushThreatEntry(entry: ThreatLogEntry) {
  threatLog.push(entry);
  const data = JSON.stringify(entry);
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function getRecentThreats(limit = 50): ThreatLogEntry[] {
  return threatLog.slice(-limit).reverse();
}

export function getThreatStats() {
  const total = threatLog.length;
  const blocked = threatLog.filter(e => e.blocked).length;
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const entry of threatLog) {
    bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
    for (const t of entry.threats) {
      if (t.type) byType[t.type] = (byType[t.type] || 0) + 1;
    }
  }

  return { total, blocked, byType, bySeverity };
}

export function pruneLogs() {
  if (threatLog.length > MAX_LOG_SIZE) {
    threatLog.splice(0, threatLog.length - MAX_LOG_SIZE);
  }
}

setInterval(pruneLogs, 60_000);
