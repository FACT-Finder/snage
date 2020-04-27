export interface DefaultCli {
    config: string;
}
export const DefaultSnageConfig = '.snage.yaml';
export const ConfigParameterName = 'config';
export const EnvPrefix = 'SNAGE';

export const printAndExit = (err: string): never => {
    console.error(err);
    process.exit(1);
};
