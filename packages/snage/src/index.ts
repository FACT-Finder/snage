import yargs from 'yargs';
import {serve} from './command/serve';
import {init} from './command/init';
import {lint} from './command/lint';

const handleExitSignal = (): void => process.exit(1);

process.on('SIGINT', handleExitSignal);
process.on('SIGTERM', handleExitSignal);

yargs
    .string('config')
    .describe('config', 'Path to the snage config.')
    .default('config', '.snage.yaml')
    .env('SNAGE')
    .command(serve)
    .command(init)
    .command(lint)
    .help()
    .demandCommand()
    .recommendCommands().argv;
