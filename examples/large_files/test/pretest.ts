import { Unit, createFileOfSize, toBytes } from 'azle/scripts/file_generator';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

async function pretest() {
    // Edge Cases
    // TODO excluded because it will require some reworking to get 0 byte files to work and it doesn't seem urgent
    // generateFileOfSize(0, 'B');
    await generateFileOfSize(1, 'B');
    await generateFileOfSize(120 * 1024 * 1024 + 1, 'B'); //One more byte than can be processed in a single hash_file_by_parts call
    await generateFileOfSize(150 * 1024 * 1024 + 1, 'B'); //One more byte than can be processed in a single write_file_by_parts call
    await generateFileOfSize(2_000_001, 'B'); // One more byte that the high water mark of the readstream

    // Weird Cases
    // TODO excluded because there isn't room on the heap. Bring back after https://github.com/wasm-forge/stable-fs/issues/2 is resolved
    // await generateFileOfSize(2_000_000 * 18, 'B'); //Weird writing bound
    // TODO excluded because there isn't room on the heap. Bring back after https://github.com/wasm-forge/stable-fs/issues/2 is resolved
    // await generateFileOfSize(2_000_000 * 18 + 1, 'B'); //Weird writing bound

    // General Cases
    await generateFileOfSize(1, 'KiB');
    await generateFileOfSize(10, 'KiB');
    await generateFileOfSize(100, 'KiB');
    await generateFileOfSize(1, 'MiB');
    await generateFileOfSize(10, 'MiB');
    await generateFileOfSize(100, 'MiB');
    await generateFileOfSize(250, 'MiB');
    // TODO excluded because there isn't room on the heap. Bring back after https://github.com/wasm-forge/stable-fs/issues/2 is resolved
    // await generateFileOfSize(500, 'MiB');
    await generateFileOfSize(1, 'GiB');

    execSync(`dfx canister uninstall-code backend || true`, {
        stdio: 'inherit'
    });

    execSync(`dfx deploy`, {
        stdio: 'inherit'
    });
}

pretest();

async function generateFileOfSize(size: number, unit: Unit) {
    const autoDir = join('assets', 'auto');
    await clearDir(autoDir);
    const path = join(autoDir, `test${size}${unit}`);
    const fileSize = toBytes(size, unit);
    await createFileOfSize(path, fileSize);
}

async function clearDir(path: string, recursive: boolean = false) {
    const files = await readdir(path);
    for (const file in files) {
        const stats = await stat(file);
        if (stats.isFile()) {
            await unlink(join(path, file));
        } else if (stats.isDirectory() && recursive) {
            clearDir(join(path, file), true);
        }
    }
}
