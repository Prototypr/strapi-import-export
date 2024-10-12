# Import Export for Strapi 5
Import/Export data from and to your database for Strapi 5 - a fork of [strapi-import-export](https://github.com/Baboo7/strapi-plugin-import-export-entries), built from scratch using the [@strapi/sdk-plugin](https://docs.strapi.io/dev-docs/plugins/development/create-a-plugin).

<img width="160" src="https://github.com/user-attachments/assets/85fbb6ed-6d7e-408d-988e-ffeaee5de9f4"/>

### NPM Install:
`npm i strapi-import-export`

### Guide

Refer to the [original docs from the previous version](https://github.com/Baboo7/strapi-plugin-import-export-entries) for how this plugin works, it's exactly the same.

---

### Strapi 5 Upgrades
There was a lot of work to migrate this plugin to Strapi 5 because of the size of it. The deprecated APIs were replaced, and all the deprecated components updated to the new Strapi design system.

- **Import** - seems to work okay (there is a known issue from the original plugin where the deepness dropdown doesn't work when the number of levels is high)
- **Export** - seems working, need testing
- Admin dashboard components (converted a lot of deprecated imports)
    - replaced select dropdowns
    - updated checkboxes to use radix api
    - loads of other similar stuff
- **Server** – converted to ESM so it can be used in Strapi 5
- **Removed most typescript** because it was causing issues, some types became out of date or could not be found.  
- **Replaced `strapi.entityService`** - this is deprecated, replaced with `strapi.documents`  

See video (this was when I first started):
[Watch on YouTube 📹](https://youtu.be/9TlyBMAC1xY)

#### Upgrade Guides:
These docs were most useful when migrating:

- [Strapi 5 Plugin Docs](https://docs.strapi.io/dev-docs/plugins/development/create-a-plugin)
- [Strapi 4 to 5 breaking changes](https://docs.strapi.io/dev-docs/migration/v4-to-v5/breaking-changes)
- [Strapi Helper plugin breaking changes](https://docs.strapi.io/dev-docs/migration/v4-to-v5/additional-resources/helper-plugin)
- [Strapi Entity Service Migration](https://docs.strapi.io/dev-docs/migration/v4-to-v5/additional-resources/from-entity-service-to-document-service#create)

