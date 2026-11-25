import { readFileSync } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { requestKey, type RecordedAnswer, type RecordedAnswers } from "./answers.js";

const RECORDED: RecordedAnswers = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "answers.json"), "utf8"));

export const RECORDED_ANSWERS = RECORDED.answers;

/** The token the replay server accepts. */
export const REPLAY_TOKEN = "replay-token";

/** The web address the tests configure for links. */
export const REPLAY_WEB_URL = "https://defectdojo.example.test";

export function recordedAnswer(key: string): RecordedAnswer {
  const answer = RECORDED.answers.find((candidate) => candidate.request === key);
  if (!answer) {
    throw new Error(`No recorded answer for ${key}`);
  }
  return answer;
}

/** The answer DefectDojo gave to a token it rejects. */
function rejectedTokenAnswer(): RecordedAnswer {
  const answer = RECORDED.answers.find((candidate) => candidate.status === 403);
  if (!answer) {
    throw new Error("No recorded answer for a rejected token");
  }
  return answer;
}

export interface ReplayServer {
  /** Base URL of the server, without a trailing slash. */
  url: string;
  /** Method and request key of every request the server got, in order. */
  requests: { method: string; key: string }[];
  /** Keys of the requests that no recorded answer fits. */
  unrecorded: string[];
  close(): Promise<void>;
}

/**
 * A local HTTP server that answers like the recorded DefectDojo: the recorded answer of a GET request,
 * the recorded rejection for any other token, 405 for any method but GET.
 */
export async function startReplayServer(): Promise<ReplayServer> {
  const requests: ReplayServer["requests"] = [];
  const unrecorded: string[] = [];

  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://replay.invalid");
    const key = requestKey(url.pathname, url.searchParams);
    requests.push({ method: request.method ?? "", key });

    const send = (answer: { status: number; body: unknown }) => {
      response.writeHead(answer.status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(answer.body));
    };

    if (request.method !== "GET") {
      send({ status: 405, body: { detail: `Method "${request.method}" not allowed.` } });
      return;
    }
    if (request.headers.authorization !== `Token ${REPLAY_TOKEN}`) {
      send(rejectedTokenAnswer());
      return;
    }
    const answer = RECORDED.answers.find((candidate) => candidate.request === key);
    if (!answer) {
      unrecorded.push(key);
      send({ status: 404, body: { detail: "No recorded answer for this request." } });
      return;
    }
    send(answer);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests,
    unrecorded,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
