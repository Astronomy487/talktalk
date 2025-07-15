# Talktalk changelog

## Version 0.2.0
2025-07-??

Translations are now automatically read from JSON files, and only are read once the client has requested translations for a particular language. Translated text may now take the form of arrays, used to handle sequences of phrases combined with spaces. Translated text may now take the form of objects with fields like "singular" and "plural", which are chosen automatically.

### Added

- `Talktalk.insertTranslations` used to manually insert translations for a particular language, if you want to
- Provided translation strings may now be arrays (joined with spaces), objects (for handling both singular and plurals), or nestings thereof (maximum depth of array-in-object-in-array. Sorry if you need more)
- Settings may be read from `settings.json`, with attributes "indicator" (default "#x"), "fallbackLanguage" (default "en"), "maxRecursion" (default 10)
- `Talktalk.directory` (the directory to look at) can now be set with the `<script>` tag that loaded `talktalk.js` using the `data-talktalk` attribute
- Added many little classes that can be handed to `Talktalk.talk` (as key or as replacement!). They serve as wrappers that go through `Intl.DisplayNames` and thus have the same configuration settings. These new classes are `Talktalk.Language`, `Talktalk.Region`, `Talktalk.Script`, `Talktalk.Currency`, `Talktalk.Calendar`, and `Talktalk.DateTimeField`. They all accept settings `*:style` and `*:fallback`.
- Same as above, but added classes `Talktalk.AmountOfMoney`, `Talktalk.AmountOfUnit`, and `Talktalk.Percent` to hand to `Intl.NumberFormat`
- When `Talktalk.talk` is given a date, it will check both replacements and its given replacements for extra formatting rules like `date:calendar`, `date:numberSystem`, and so on; see documentation for complete list
- Added `Talktalk.TimeOfDay`, which is just a wrapper class for a `Date` object. Useful because you can set a separate default display rulesets for times of day (e.g. 9:00 AM) instead of dates (e.g. 12/5/2023)! These are marked with `timeOfDay:*` (where `*` is all the same properties as `dates`. Again, see documentation.) Default settings DO include `timeOfDay:hour = "numeric"` and `timeOfDay:minute = "2-digit"` because otherwise it would display dates lol
- Added optional settings `forceLanguageWithQueryParameter` and `forceLanguage` in settings.json, which lets you force languages with higher priority than the user's `navigator.language`/`navigator.languages`
- `document.dir` is now set to "ltr" or "rtl" when the language sequence is loaded

### Changed

- `Talktalk.say` renamed to `Talktalk.talk`
- `Talktalk.indicator` has become `Talktalk.indicatorBefore` and `Talktalk.indicatorAfter`. You can set these manually, or using the "indicator" field of the new `settings.json`

### Removed

- `Talktalk.provide` is no longer used to supply translations. Translations are now dynamically read from `talktalk/[lang].json` files

## Version 0.1.0
2025-07-10

This is the very first version! Wow!

### Added

- `Talktalk.indicator` used to mark special spots in strings, default "#"
- `Talktalk.provide` function to provide translations to Talktalk
- `Talktalk.fillElements` function to scan a webpage for replacements
- `Talktalk.say` used to translate a translation key