export const expectNever = (value: never): never => {
    throw new Error('expected never but got ' + value);
};
export const ffVersionRegex = /(\d+)\.?(\d+)?\.?(\d+)?-?(\d+|SNAPSHOT)?/;
export const requiredFFVersionRegex = /(\d+)\.(\d+)\.(\d+)-(\d+|SNAPSHOT)/;
