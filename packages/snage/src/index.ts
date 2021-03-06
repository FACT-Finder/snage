import yargs from 'yargs';
import {serve} from './command/serve';
import {init} from './command/init';
import {lint} from './command/lint';
import {create} from './command/create';
import {ConfigParameterName, DefaultSnageConfig, EnvPrefix} from './command/common';
import {find} from './command/find';
import {set} from './command/set';
import {migrate} from './command/migrate';
import {exportCmd} from './command/export';
import {fill} from './command/fill';

const handleExitSignal = (): void => process.exit(1);

process.on('SIGINT', handleExitSignal);
process.on('SIGTERM', handleExitSignal);

yargs
    .version(process.env.BUILD_VERSION ?? 'development')
    .string(ConfigParameterName)
    .describe(ConfigParameterName, 'Path to the snage config.')
    .default(ConfigParameterName, DefaultSnageConfig)
    .env(EnvPrefix)
    .command(serve)
    .command(create)
    .command(init)
    .command(find)
    .command(lint)
    .command(set)
    .command(migrate)
    .command(exportCmd)
    .command(fill)
    .help()
    .demandCommand()
    .recommendCommands().argv;
