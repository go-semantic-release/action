# go-semantic-release/action

## Usage

To integrate [go-semantic-release](https://github.com/go-semantic-release/semantic-release) with your GitHub Actions pipeline, specify the name of this repository with a version tag as a step within your workflow config file:

```yaml
steps:
  - uses: actions/checkout@master
  - uses: go-semantic-release/action@v1
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Arguments

| Input                                | Description                                                                            | Usage    |
|--------------------------------------|----------------------------------------------------------------------------------------|----------|
| `github-token`                       | Used to create releases                                                                | Required |
| `changelog-file`                     | Create a changelog file                                                                | Optional |
| `ghr`                                | Create a .ghr file with the parameters for [tcnksm/ghr](https://github.com/tcnksm/ghr) | Optional |
| `update-file`                        | Update the version of a certain file                                                   | Optional |
| `dry`                                | Do not create a release                                                                | Optional |
| `prerelease`                         | Flags the release as a prerelease                                                      | Optional |
| `allow-initial-development-versions` | Starts your initial development release at 0.1.0                                       | Optional |

## Example `ci.yml` for an npm package

```yaml
name: CI
on:
  push:
    branches:
      - '**'
  pull_request:
    branches:
      - '**'

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        node: [10, 12]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
  release:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: 12
          registry-url: 'https://registry.npmjs.org'
      - uses: go-semantic-release/action@v1
        id: semrel
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          update-file: package.json
      - run: npm publish
        if: steps.semrel.outputs.version != ''
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## License

The [MIT License (MIT)](http://opensource.org/licenses/MIT)

Copyright © 2020 [Christoph Witzko](https://github.com/christophwitzko)
