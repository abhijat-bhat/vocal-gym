#!/usr/bin/env node
import { main } from '../src/cli/main.js';
// stop quietly when the output is piped into something that closes early, such as head
process.stdout.on('error', err => { if (err.code === 'EPIPE') process.exit(0); throw err; });
process.exitCode = main(process.argv.slice(2));
