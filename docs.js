const yargs = require('yargs');
const { spawn } = require('child_process');
const IMAGE = 'squidfunk/mkdocs-material:5.2.2'

const watch = {
    command: 'watch',
    describe: 'watch docs',
    builder: (yargs) =>
        yargs
            .number('port')
            .default('port', 9090)
            .describe('port', 'The port mkdocs should listen on'),
    handler: ({port}) => {
        const command = `docker run --rm -it -p ${port}:8000 -v ${__dirname}:/docs ${IMAGE}`;
        console.log(command);
        spawn(command, {
            stdio: 'inherit',
            shell: true,
        });
    },
};
const build = {
    command: 'build',
    describe: 'build docs',
    handler: () => {
        const command = `docker run --rm -v ${__dirname}:/docs ${IMAGE} build`;
        console.log(command);
        spawn(command, {stdio: 'inherit', shell: true});
    },
};

yargs.command(watch).command(build).demandCommand().argv;
