# Import export for Strapi 5 (WIP)

⚠️ This plugin is half finished and not ready for production - needs help from the community to finish.

- This is a fork of [strapi-import-export](https://github.com/Baboo7/strapi-plugin-import-export-entries) by @Baboo7, but built from scratch starting with this [guide](https://docs.strapi.io/dev-docs/plugins/development/create-a-plugin) to work with Strapi 5 and use the new API.

## Done
- **Import via Code Editor** (e.g. paste in the export from a Strapi 4 instance)
- Admin dashboard components started (converted a lot of the deprecated imports)
- Server stuff converted to ESM so it can be used in Strapi 5
- Removed a lot of typescript because it was causing issues

See video:
[Watch on YouTube 📹](https://youtu.be/9TlyBMAC1xY)

## TODO
- Export modal on Admin panel - you can follow the code from the import modal
- Check if import from file/csv works
- Convert back to typescript if you want (I don't need this though)

Useful Links:
- [Strapi 5 Plugin Docs](https://docs.strapi.io/dev-docs/plugins/development/create-a-plugin)
- [Strapi 4 to 5 breaking changes](https://docs.strapi.io/dev-docs/migration/v4-to-v5/breaking-changes)
- [Strapi Helper plugin breaking changes](https://docs.strapi.io/dev-docs/migration/v4-to-v5/additional-resources/helper-plugin)
