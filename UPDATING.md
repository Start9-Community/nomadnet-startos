# Updating the upstream version

Upstream is the `nomadnet` package on PyPI, installed into a self-built image by the
root `Dockerfile`. Upstream's own container image (`ghcr.io/markqvist/nomadnet`) is
amd64-only, which is why the package builds its own. The `rns` and `lxmf` dependencies
are not pinned separately; pip resolves them from `nomadnet`'s own requirements at
build time. `ttyd` is a second, independently pinned source.

## Determining the upstream version

The pin is `ARG NOMADNET_VERSION` in `Dockerfile`. The latest release:

```sh
curl -s https://pypi.org/pypi/nomadnet/json | jq -r .info.version
```

GitHub tags on `markqvist/NomadNet` match the PyPI versions (no `v` prefix). The repo is a
public mirror; PyPI is where releases reliably land.

For ttyd, the pin is `ARG TTYD_VERSION` plus the two `TTYD_SHA256_*` args:

```sh
curl -s https://api.github.com/repos/tsl0922/ttyd/releases/latest | jq -r .tag_name
curl -sL https://github.com/tsl0922/ttyd/releases/download/<tag>/SHA256SUMS | grep -E 'x86_64|aarch64'
```

## Applying the bump

1. Set `NOMADNET_VERSION` in `Dockerfile`.
2. Set the version in `startos/versions/current.ts` to the same upstream version (e.g.
   `1.5.1:0`).
3. Check that upstream's config handling still matches what `startos/init/seedConfig.ts`
   and `startos/actions/nodeSettings.ts` rely on: the module constant
   `nomadnet.NomadNetworkApp.__default_nomadnet_config__`, and the `[node]` keys
   `enable_node`, `node_name`, `disable_propagation`, `message_storage_limit`, and
   `[textui] glyphs`.

For ttyd, set `TTYD_VERSION` and both `TTYD_SHA256_*` values from the release's
`SHA256SUMS`.
