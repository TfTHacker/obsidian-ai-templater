# 1.0.14
### Updates
- update for support for gpt5
- updated dependencies
- fixed stylesheet issues

# 1.0.11

### Updates
- Updating plugin to newest Obsidian recommendations https://docs.obsidian.md/oo24/plugin.
- The internal command names have been renamed. Any plugins using these internal command names will need to be updated.
- Transition to Biome from EsLint and Prettier.
- The output log file format for when debugging is enabled in BRAT has changed. It now appends to the log file, not prepends.



# 1.0.10

- chore: update all dependencies.

# 1.0.9

- Minor adjustments have been made in preparation for release to the community plugin list.

# 1.0.6

- Restructured the API object of ait. All the helper classes have been moved to a child object named `helpers`. This modification makes the API object cleaner and more user-friendly.

# 1.0.5

- Added the OpneAI undocumented toFile function. This is useful for uploading files to OpenAI.

# 1.0.4

- Exposed the ActivityIndicator class, which creates the spinning indicator that can be used when the user is waiting for a response from the api.
- moved the global OpenAI object to be a child of the ait object.

# 1.0.3

- When the outgoint character count is exceeded, the notificaiton now includes the number of characters attempted to send to the api.
- Improved the github action build process
