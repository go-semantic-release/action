# Go Semantic Release Github Action

## Usage

To integrate go-semantic-release with your Actions pipeline, specify the name of this repository with a tag number as a step withint your `workflow.yml` file

```yaml
steps:
  - uses: actions/checkout@master
  - uses: go-semantic-release/action@v1
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      dry: false
      allow-initial-development-versions: true
```

## Arguments

|                Input                 |                   Description                    | Usage                         |
| :----------------------------------: | :----------------------------------------------: | ----------------------------- |
|            `github-token`            |    Used to authorize coverage report uploads     | _Required to create releases_ |
|           `changelog-file`           |                Create a changelog                | Optional                      |
|            `update-file`             |          updates the version in a file           | Optional                      |
|                `dry`                 |             do not create a release              | Optional                      |
|             `prerelease`             |        flags the release as a prerelease         | Optional                      |
| `allow-initial-development-versions` | starts your initial development release at 0.1.0 | Optional                      |

## Example `workflow.yml` with Release action

```yaml
name: Example workflow for Go Semantic Release
on: [push]
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - name: Semantic Release
        uses: go-semantic-release/action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          dry: false
          allow-initial-development-versions: true
```

## License

The [MIT License (MIT)](http://opensource.org/licenses/MIT)

Copyright © 2020 [Christoph Witzko](https://github.com/christophwitzko)
