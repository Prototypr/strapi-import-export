# Import export for Strapi 5

- This is a fork of [strapi-import-export](https://github.com/Baboo7/strapi-plugin-import-export-entries) by @Baboo7, but built from scratch starting with this [guide](https://docs.strapi.io/dev-docs/plugins/development/create-a-plugin) to work with Strapi 5 and use the new API.

- Fairly untested, but mostly working

## Done
- **Import** - seems to work okay (there is a known issue from the original plugin where the deepness dropdown doesn't work when the number of levels is high)
- **Export** - seems working, need testing
- Admin dashboard components started (converted a lot of the deprecated imports)
    - replaced select dropdowns
    - updated checkboxes to use radix api
    - loads of other similar stuff
- Server stuff converted to ESM so it can be used in Strapi 5
- Removed a lot of typescript because it was causing issues with new plugin development yalc, and types became out of date 
- Replace all `strapi.entityService` - that gonna be deprecated 

See video (this was when I first started):
[Watch on YouTube 📹](https://youtu.be/9TlyBMAC1xY)

## TODO
- Convert back to typescript if you want (I don't need this though)

Useful Links:
- [Strapi 5 Plugin Docs](https://docs.strapi.io/dev-docs/plugins/development/create-a-plugin)
- [Strapi 4 to 5 breaking changes](https://docs.strapi.io/dev-docs/migration/v4-to-v5/breaking-changes)
- [Strapi Helper plugin breaking changes](https://docs.strapi.io/dev-docs/migration/v4-to-v5/additional-resources/helper-plugin)
- [Strapi Entity Service Migration](https://docs.strapi.io/dev-docs/migration/v4-to-v5/additional-resources/from-entity-service-to-document-service#create)
