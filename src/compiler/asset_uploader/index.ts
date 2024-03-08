import { execSync } from 'child_process';
import { Actor, ActorSubclass, HttpAgent } from '@dfinity/agent';
import { readFileSync, existsSync, createReadStream } from 'fs';
import { DfxJson } from '../utils/types';
import { getCanisterId } from '../../../test';
import { readdir, stat, open } from 'fs/promises';
import { join } from 'path';

type Src = string;
type Dest = string;

/**
 * Upload an asset at srcPath to destPath at the given canister. If neither
 * the srcPath nor the destPath are given the srcPath(s) and desPath(s) will
 * be determined from the dfx.json of the given canister.
 *
 * Because of limitations on block consensus rate and ingress message limits
 * the uploaded assets will be broken up into 2 MB chunks (to be less than the
 * message size limit) and sent to the canister 2 chunks per second so as to be
 * bellow the 4MiB per second block rate. For small chunks more could be sent
 * per second but for simplicity it has been capped at 2 chunks per second.
 *
 * The time it takes to upload a file is largely determined by the amount of
 * throttling. In good circumstances a 1 GiB will therefore take about 5 minutes
 * to upload.
 * @param canisterName
 * @param srcPath
 * @param destPath
 */
export async function uploadAssets(
    canisterName: string,
    srcPath?: Src,
    destPath?: Dest
) {
    const assetsToUpload = getAssetsToUpload(canisterName, srcPath, destPath);

    const canisterId = getCanisterId(canisterName);

    const replicaWebServerPort = execSync(`dfx info webserver-port`)
        .toString()
        .trim();

    const actor = await createUploadAssetActor(
        canisterId,
        replicaWebServerPort
    );

    const chunkSize = 2_000_000; // The current message limit is about 2 MiB

    for (let i = 0; i < assetsToUpload.length; i++) {
        const [srcPath, destPath] = assetsToUpload[i];
        // Await each upload so the canister doesn't get overwhelmed by requests
        await upload(srcPath, destPath, chunkSize, actor);
    }
}

async function upload(
    srcPath: Src,
    destPath: Dest,
    chunkSize: number,
    actor: ActorSubclass
) {
    if (!existsSync(srcPath)) {
        console.log(`WARNING: ${srcPath} does not exist`);
        return;
    }

    const stats = await stat(srcPath);
    if (stats.isDirectory()) {
        // Await each upload so the canister doesn't get overwhelmed by requests
        await uploadDirectory(srcPath, destPath, chunkSize, actor);
    } else {
        // Await each upload so the canister doesn't get overwhelmed by requests
        await uploadAsset(srcPath, destPath, chunkSize, actor);
    }
}

async function uploadDirectory(
    srcDir: string,
    destDir: string,
    chunkSize: number,
    actor: ActorSubclass
) {
    try {
        const names = await readdir(srcDir);
        for (const name of names) {
            const srcPath = join(srcDir, name);
            const destPath = join(destDir, name);
            // Await each upload so the canister doesn't get overwhelmed by requests
            await upload(srcPath, destPath, chunkSize, actor);
        }
    } catch (error) {
        console.error(`Error reading directory: ${error}`);
    }
}

async function uploadAsset(
    srcPath: Src,
    destPath: Dest,
    chunkSize: number,
    actor: ActorSubclass
) {
    if (process.env.AZLE_VERBOSE === 'true') {
        console.info(`Uploading ${srcPath} to ${destPath}`);
    }
    const timestamp = process.hrtime.bigint();
    const file = await open(srcPath, 'r');
    const stats = await file.stat();
    const size = stats.size;
    let chunkNumber = 0;
    // for (let i = 0; i < size; i += chunkSize) {
    //     const fileStream = createReadStream(srcPath, {
    //         start: i,
    //         end: i + chunkSize - 1
    //     });

    //     for await (const data of fileStream) {
    //         chunkNumber++;
    //         await throttle();
    //         // Don't await here! Awaiting the agent will result in about a 4x increase in upload time.
    //         // The above throttling is sufficient to manage the speed of uploads
    //         actor
    //             .upload_asset(destPath, timestamp, chunkNumber, data, size)
    //             .catch((error) => {
    //                 if (process.env.AZLE_VERBOSE === 'true') {
    //                     console.error(error);
    //                 }
    //             });
    //     }
    // }
    let position = 0;
    while (position < size) {
        const buffer = Buffer.alloc(chunkSize);
        const result = await file.read(buffer, 0, chunkSize, position);
        const chunk = result.buffer.subarray(0, result.bytesRead);

        if (process.env.AZLE_VERBOSE === 'true') {
            console.info(
                `Uploading chunk ${chunkNumber} of ${Math.ceil(
                    size / chunkSize
                )}`
            );
        }

        await throttle();
        // Don't await here! Awaiting the agent will result in about a 4x increase in upload time.
        // The above throttling is sufficient to manage the speed of uploads
        actor
            .upload_asset(destPath, timestamp, chunkNumber, chunk, size)
            .catch((error) => {
                if (process.env.AZLE_VERBOSE === 'true') {
                    console.error(error);
                }
            });

        position += result.bytesRead;
        chunkNumber++;
    }
    file.close();
    if (process.env.AZLE_VERBOSE === 'true') {
        console.info(`Finished uploading ${srcPath}`);
    }
}

async function throttle() {
    // We can only process about 4Mib per second. So if chunks are about
    // 2 MiB or less then we can only send off two per second.
    await new Promise((resolve) => setTimeout(resolve, 500)); // Should be 500 (ie 1 every 1/2 second or 2 every second)
}

function getAssetsToUpload(
    canisterId: string,
    srcPath?: Src,
    destPath?: Dest
): [Src, Dest][] {
    if (srcPath === undefined && destPath !== undefined) {
        throw new Error(
            'Dest path must not be undefined if a src path is defined'
        );
    } else if (srcPath !== undefined && destPath === undefined) {
        throw new Error(
            'Src path must not be undefined if a dest path is defined'
        );
    } else if (srcPath === undefined && destPath === undefined) {
        // If both paths are undefined, look at the dfx.json for the assets to upload
        const dfxJson: DfxJson = JSON.parse(
            readFileSync('dfx.json').toString()
        );
        return dfxJson.canisters[canisterId].assets_large ?? [];
    } else if (srcPath !== undefined && destPath !== undefined) {
        return [[srcPath, destPath]];
    }
    throw new Error('Unreachable');
}

async function createUploadAssetActor(
    canisterId: string,
    replicaWebServerPort: string
): Promise<ActorSubclass> {
    const host =
        process.env.DFX_NETWORK === 'ic'
            ? `https://icp-api.io`
            : `http://127.0.0.1:${replicaWebServerPort}`;

    const agent = new HttpAgent({
        host
    });

    if (process.env.DFX_NETWORK !== 'ic') {
        await agent.fetchRootKey();
    }

    return Actor.createActor(
        ({ IDL }) => {
            return IDL.Service({
                upload_asset: IDL.Func(
                    [
                        IDL.Text,
                        IDL.Nat64,
                        IDL.Nat64,
                        IDL.Vec(IDL.Nat8),
                        IDL.Nat64
                    ],
                    [],
                    []
                )
            });
        },
        {
            agent,
            canisterId
        }
    );
}
