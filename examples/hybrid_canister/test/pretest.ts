import { execSync } from 'child_process';

async function pretest() {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    execSync(`dfx canister uninstall-code server || true`, {
        stdio: 'inherit'
    });

    execSync(
        `dfx canister uninstall-code server_init_and_post_upgrade || true`,
        {
            stdio: 'inherit'
        }
    );

    execSync(`dfx canister uninstall-code canister || true`, {
        stdio: 'inherit'
    });

    execSync(`dfx deploy`, {
        stdio: 'inherit'
    });

    execSync(`dfx generate`, {
        stdio: 'inherit'
    });
}

pretest();
