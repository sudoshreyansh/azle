If you change the code in `azle/src/compiler/rust`, the Docker/Podman hash will change. This will cause deploys to fail without `AZLE_USE_DOCKERFILE=true` being set, and will cause an image rebuild otherwise.

To use an already-existing Docker/Podman image, as long as you are only making changes to the `azle/src/compiler/rust` directory contents and not to the Dockerfile itself, you can set `AZLE_DOCKERFILE_HASH` equal to the hash of the last working Docker/Podman image. You can find this hash at `~/.config/azle`, you should see your `azle__image__[hash].tar` file, and you can extract the hash from that filename.