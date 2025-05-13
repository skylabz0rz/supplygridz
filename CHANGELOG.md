# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.0.2] - 2025-05-13
### Added
- Auth0 fallback logic wrapped in `initAuth()`
- NPCs now spawn even if login fails or user is not logged in

### Changed
- Moved Auth0 client initialization to avoid hard failures
- Main bootstrap now handles guest mode and logged-in mode

---

## [0.0.1] - 2025-05-11
### Added
- Initial upload of SupplyGridz core (frontend + backend)
- NPC logic, OSM map, player company creation
- Basic vehicle purchase and placement UI
