import { cleanDeploy, run_tests, Test } from 'azle/test';
import { createActor } from './dfx_generated/stable_memory';

const stable_memory_canister = createActor('rrkah-fqaaa-aaaaa-aaaaq-cai', {
    agentOptions: {
        host: 'http://127.0.0.1:8000'
    }
});

const tests: Test[] = [
    ...cleanDeploy('stable_memory'),
    {
        name: 'stable size',
        test: async () => {
            const result = await stable_memory_canister.stable_size();

            return {
                ok: result === 0
            };
        }
    },
    {
        name: 'stable64 size',
        test: async () => {
            const result = await stable_memory_canister.stable64_size();

            return {
                ok: result === 0n
            };
        }
    }
];

run_tests(tests);
