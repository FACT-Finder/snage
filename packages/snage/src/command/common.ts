import * as IO from 'fp-ts/lib/IO';

export interface DefaultCli {
    config: string;
}

export const DefaultSnageConfig = '.snage.yaml';
export const ConfigParameterName = 'config';
export const EnvPrefix = 'SNAGE';

export const printAndExit =
    (err: string): IO.IO<never> =>
    () => {
        console.error(err);
        process.exit(1);
    };

export const print =
    (msg: string): IO.IO<void> =>
    () =>
        console.log(msg);
