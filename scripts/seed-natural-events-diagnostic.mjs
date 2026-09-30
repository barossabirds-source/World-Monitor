#!/usr/bin/env node
import { fetchNaturalEvents } from './seed-natural-events.mjs';
import { getRedisCredentials, redisCommand } from './_seed-utils.mjs';

const key = 'diagnostic:natural-events:last-run';
const startedAt = Date.now();
let result;

try {
  const data = await fetchNaturalEvents({ now: Date.now(), runStartedAtMs: startedAt });
  result = {
    ok: true,
    startedAt,
    finishedAt: Date.now(),
    eventCount: Array.isArray(data?.events) ? data.events.length : null,
    unsafePublication: Boolean(data?._unsafePublication),
    eonetFailed: Boolean(data?._eonetFailed),
    gdacsFailedTypes: Array.isArray(data?._gdacsFailedTypes) ? data._gdacsFailedTypes : [],
    nhcFailureDetail: data?._nhcFailureDetail || null,
    westernPacificDataAvailable: data?.westernPacific?.dataAvailable === true,
    hkoDataAvailable: data?.hkoWarnings?.dataAvailable === true,
  };
} catch (error) {
  result = {
    ok: false,
    startedAt,
    finishedAt: Date.now(),
    error: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : null,
  };
}

const { url, token } = getRedisCredentials();
await redisCommand(url, token, ['SET', key, JSON.stringify(result), 'EX', 3600], {
  label: 'Redis natural-events diagnostic SET',
});
console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
