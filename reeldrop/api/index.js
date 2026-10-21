import { handleApiOrMcpRequest, sendJson } from "../server/appHandler.mjs";

export default async function handler(req, res) {
  try {
    await handleApiOrMcpRequest(req, res);
  } catch (err) {
    console.error("[Velora Serverless Error]", err);
    sendJson(res, 500, { error: err.message || "Internal serverless error" });
  }
}
