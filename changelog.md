# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2018-05-16
### Added
- Fixing *$NPM_EMAIL* by introducing the travis encrypted nmp user email

### Changed
- Update travis npm deployer by reactivating _*email: $NPM_EMAIL*_

## [1.1.1] - 2018-05-16
### Removed
- Remove *email: $NPM_EMAIL* section from .travis.yml due to travis npm deploy *invalid option "--email="*

## [1.1.0] - 2018-05-16
### Added
- Adding version bump as npm part of npm command.
- Adding .travis.yml which come with slack, gitter notifiers and npm deployer
- Adding "publishConfig" section to declare this repository acecess as "public"

### Changed
- Update package.json file which now include version bumping task 

### Removed
- Remove the "CHANGELOG" generator from npm archetype.

## [1.0.1] - 2018-03-1
### Changed
- README.md badge reorganization.

## [1.0.0] - 2018-02-26
### Changed
- General code reformating & indentation.
- Update version label at package.json.

### Removed
- Remove .codeclimate.yml configuration file.
- Remove run.sh deployment script file

## [0.0.2] - 2018-02-26
### Added
- Initial public version publication.

[Unreleased]: https://github.com/djanta/djantaio-tools-bump/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/djanta/djantaio-tools-bump/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/djanta/djantaio-tools-bump/compare/v1.0.1...v1.1.1
[1.1.0]: https://github.com/djanta/djantaio-tools-bump/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/djanta/djantaio-tools-bump/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/djanta/djantaio-tools-bump/compare/v0.0.2...v1.0.0
[0.0.2]: https://github.com/djanta/djantaio-tools-bump/compare/v0.1.0...v0.2.0
