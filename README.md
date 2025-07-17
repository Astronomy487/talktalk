# Talktalk

Current version: 0.3.1

> Talk to me in fr-FR
> Talk to me in es-MX
> Talk to me in your user's native language

Talktalk is a JavaScript library for supporting translations for webpages. Its goal is to make it stupidly easy to support multiple languages seamlessly on one webpage.

You store each language's strings in a separate JSON file. Talktalk can either automatically replace HTML elements marked with `data-talktalk` (useful for static elements) or called in JavaScript via `Talktalk.talk`.

Talktalk also handles "special types" like dates, numbers, and other things supported in the `Intl` namespace.

> [!WARNING]  
> This library is still in initial development! You know what that entails

## Minimal example

Import `talktalk.0.3.1.js` via a `<script>` tag. Once loaded, it will read the user's device language(s) to get its sequence of preferred languages (e.g. `["en-US", "en"]`). "en" will always appear as a fallback. It will look for files named `talktalk/en-US.json` and `talktalk/en.json` to associate "translation keys" with translated strings.

talktalk/en.json:
```json
{
	"title": "Title of the webpage",
	"user": "User",
	"message": "Hello, #name!"
}
```

index.html:
```html
<script src="talktalk/talktalk.0.3.1.js"></script>
<h1 data-talktalk="title"></h1>
<script>
	console.log(Talktalk.talk("message", {name: "world"}));
</script>
```

The above snippet demonstrates the two ways of getting translated text:

1. Any (non-script) element marked with a `data-talktalk` attribute will have its innerText set to a translated string. The `data-talktalk` content is the translation key.
2. `Talktalk.talk(key)` also performs a lookup and returns a string. If the translation string has replacement markers (e.g. "#name"), you can provide an object indicating what replacements to make (e.g. `{name: "world"}`). Here, "world" is a literal string, not another translation key. (You can nest `Talktalk.talk` calls if you really need it to perform another lookup.) It is also possible to pass numbers and some other data types as values in the replacement object; see "Using special types" section for full list.

If a translation isn't available for a higher-priority language, Talktalk will look at the lower-priority languages for a translation string. This is why a user with `en-US` only needs `en.json` to exist. However, if translations are only partially implemented for another language, the fallback text might be in literally a different language! (i.e. if `es.json` is missing a translation key, and it has to fallback to `en.json`)

## Handling singular and plural forms

Translation strings are usually just strings. If a translation string is actually an array, then each of the provided strings will be joined with the language's space character.

If a translation string is actually an object, this indicates a number-sensitive translation. The string must receive exactly one number as a replacement so it can determine which form to take.

```json
"thingcount": {
	"singular": "There is #n thing.",
	"plural": "There are #n things."
}
```

In the above JSON, `Talktalk.talk("thincount", {n: 1})` would yield "There is 1 thing." and `Talktalk.talk("thincount", {n: 3})` would yield "There are 3 things.".

The keys for such an object may be the following:

- `negative`
- `fractional`
- `zero`/`none`
- `one`/`singular`
- `two`/`dual`
- `few`/`paucal` (only present in languages that have paucal forms!)
- `many`/`plural`
- `other` (always exists as a fallback)

In most languages, `singular` and `plural` are sufficient to cover all numbers (i.e. `dual` and `paucal` will always fall back to `plural` because it's a more general category). Note that in Arabic, the `zero` form is separate (in accordance with `Intl.PluralRules`'s implementation).

Some amount of nesting of arrays and objects are allowed; at most, a translation string may be an array inside an object inside an array. This nesting is useful if a translation string contains several quantity-sensitive words:

```json
"bookinginfo": [
	"You have booked",
	{
		"zero": "no rooms",
		"singular": "#rooms room",
		"plural": "#rooms rooms"
	},
	"for",
	{
		"zero": "no nights.",
		"singular": "#nights night.",
		"plural": "#nights nights."
	}
]
```

The above JSON mixes strings and objects into an array, which lets different parts of the sentence react to different numbers.

Translations can also be inserted after the fact with `Talktalk.insertTranslations(lang, obj)`, where `lang` is the language and `obj` is an object containing translation key-value pairs.

## Using special types

When `Talktalk.talk` is handed a string, it converts it as a translation key. When handed something of any of the following classes, Talktalk handles the item accordingly. These types are simply handed off to an `Intl` formatter.

For `Intl` formatters that don't have corresponding types in vanilla JavaScript, I've included classes in `Talktalk` to represent them.

For all of the below special types, the settings are made to exactly mirror the settings available in the `Intl` formatter options. All fields are optional. These settings can either be provided in the replacement object (e.g. `Talktalk.talk(5, {"number:minimumIntegerDigits": 2})`) or directly in the language's JSON file. Unlike other translation keys, these settings won't accept fallback to different languages (e.g. a user with preferred language sequence `["es-MX", "es", "en"]`, when formatting a Date in Spanish, will only look for settings in `es-MX.json` and `es.json`. Format settings in `en.json` are ignored.)

| Class                  | Purpose                                                                                                                                                                                                                      | Constructor parameter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Settings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| number                 | Numbers (e.g. 487)                                                                                                                                                                                                           |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `number:numberingSystem`, `number:style`, `number:currency`, `number:currencyDisplay`, `number:currencySign`, `number:unit`, `number:unitDisplay`, `number:minimumIntegerDigits`, `number:minimumFractionDigits`, `number:maximumFractionDigits`, `number:minimumSignificantDigits`, `number:maximumSignificantDigits`, `number:roundingPriority`, `number:roundingIncrement`, `number:roundingMode`, `number:trailingZeroDisplay`, `number:notation`, `number:compactDisplay`, `number:useGrouping`, `number:signDisplay`                                             |
| list                   | Lists of things separated by commas (e.g. red, white, and blue)                                                                                                                                                              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `list:type`, `list:style`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Date                   | Dates (e.g. 12/5/2023)                                                                                                                                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `date:calendar`, `date:numberFormat`, `date:hour12`, `date:hourCycle`, `date:timeZone`, `date:weekday`, `date:era`, `date:year`, `date:month`, `date:day`, `date:dayPeriod`, `date:hour`, `date:minute`, `date:second`, `date:fractionalSecondDigits`, `date:timeZoneName`                                                                                                                                                                                                                                                                                             |
| Talktalk.Duration      | Durations of time (e.g. 1h 5m 12s)                                                                                                                                                                                           | (1) ISO-8601 duration string, or (2) a number and a unit from "years", "months", "weeks", "days", "hours", "minutes", or "seconds", or (3) a number of seconds (overflows into minutes if exceeds 60s, into hours if exceeds 3600s, into days if exceeds 86400s)                                                                                                                                                                                                                                                            | `duration:numberingSystem`, `duration:style`, `duration:years`, `duration:yearsDisplay`, `duration:months`, `duration:monthsDisplay`, `duration:weeks`, `duration:weekDisplay`, `duration:days`, `duration:daysDisplay`, `duration:hours`, `duration:hoursDisplay`, `duration:minutes`, `duration:minutesDisplay`, `duration:seconds`, `duration:secondsDisplay`, `duration:milliseconds`, `duration:millisecondsDisplay`, `duration:microseconds`, `duration:microsecondsDisplay`, `duration:nanoseconds`, `duration:nanosecondsDisplay`, `duration:fractionalDigits` |
| Talktalk.Language      | Languages (e.g. English)                                                                                                                                                                                                     | ISO-639 language code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `language:style`, `language:fallback`, `language:languageDisplay`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Talktalk.Region        | Countries/regions (e.g. United States)                                                                                                                                                                                       | ISO-3166 region code or UN-M49 geographic region code                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `region:style`, `region:fallback`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Talktalk.Script        | Writing systems (e.g. Cyrillic)                                                                                                                                                                                              | ISO-15924 script code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `script:style`, `script:fallback`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Talktalk.Currency      | Currencies (e.g. Euro)                                                                                                                                                                                                       | ISO-4217 currency code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `currency:style`, `currency:fallback`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Talktalk.Calendar      | Calendar systems (e.g. Gregorian Calendar)                                                                                                                                                                                   | Look [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf#supported_calendar_types) for list of supported calendar identifiers                                                                                                                                                                                                                                                                                                                                    | `calendar:style`, `calendar:fallback`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Talktalk.DateTimeField | A unit that appears in Dates (e.g. hour)                                                                                                                                                                                     | One of"era", "year", "quarter", "month", "weekOfYear", "weekday", "day", "dayPeriod", "hour", "minute", "second", or "timeZoneName"                                                                                                                                                                                                                                                                                                                                                                                         | `dateTimeField:style`, `dateTimeField:fallback`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Talktalk.TimeOfDay     | A particular time of day (e.g. 9:32 AM). Secretly just a wrapper class for Dates! Exists so you can define separate rulesets for Dates and TimeOfDay, because it's usually awkward to have Date objects cover both use cases | (1) No parameters for current time, or (2) a Date object, or (3) a string, passed into a Date constructor                                                                                                                                                                                                                                                                                                                                                                                                                   | `timeOfDay:calendar`, `timeOfDay:numberFormat`, `timeOfDay:hour12`, `timeOfDay:hourCycle`, `timeOfDay:timeZone`, `timeOfDay:weekday`, `timeOfDay:era`, `timeOfDay:year`, `timeOfDay:month`, `timeOfDay:day`, `timeOfDay:dayPeriod`, `timeOfDay:hour`, `timeOfDay:minute`, `timeOfDay:second`, `timeOfDay:fractionalSecondDigits`, `timeOfDay:timeZoneName`                                                                                                                                                                                                             |
| Talktalk.AmountOfMoney | Particular amounts of a certain currency (e.g. CA$5.00)                                                                                                                                                                      | A number and an ISO-4217 currency code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `amountOfMoney:numberingSystem`, `amountOfMoney:currencyDisplay`, `amountOfMoney:currencySign`, `amountOfMoney:minimumIntegerDigits`, `amountOfMoney:minimumFractionDigits`, `amountOfMoney:maximumFractionDigits`, `amountOfMoney:minimumSignificantDigits`, `amountOfMoney:maximumSignificantDigits`, `amountOfMoney:roundingPriority`, `amountOfMoney:roundingIncrement`, `amountOfMoney:roundingMode`, `amountOfMoney:trailingZeroDisplay`, `amountOfMoney:notation`, `amountOfMoney:compactDisplay`, `amountOfMoney:useGrouping`, `amountOfMoney:signDisplay`     |
| Talktalk.AmountOfUnit  | Particular amounts of a certain unit (e.g. 4.87 kg)                                                                                                                                                                          | A number and one of "acre", "bit", "byte", "celsius", "centimeter", "day", "degree", "fahrenheit", "fluid-ounce", "foot", "gallon", "gigabit", "gigabyte", "gram", "hectare", "hour", "inch", "kilobit", "kilobyte", "kilogram", "kilometer", "liter", "megabit", "megabyte", "meter", "microsecond", "mile", "mile-scandinavian", "milliliter", "millimeter", "millisecond", "minute", "month", "nanosecond", "ounce", "percent", "petabyte", "pound", "second", "stone", "terabit", "terabyte", "week", "yard", or "year" | `amountOfUnit:numberingSystem`, `amountOfUnit:unitDisplay`, `amountOfUnit:minimumIntegerDigits`, `amountOfUnit:minimumFractionDigits`, `amountOfUnit:maximumFractionDigits`, `amountOfUnit:minimumSignificantDigits`, `amountOfUnit:maximumSignificantDigits`, `amountOfUnit:roundingPriority`, `amountOfUnit:roundingIncrement`, `amountOfUnit:roundingMode`, `amountOfUnit:trailingZeroDisplay`, `amountOfUnit:notation`, `amountOfUnit:compactDisplay`, `amountOfUnit:useGrouping`, `amountOfUnit:signDisplay`                                                      |

Each `Talktalk.*` can be instantiated either as `new Talktalk.NameOfSpecialType(...parameters)` (normal constructor) or as `Talktalk.nameOfSpecialType(...parameters)` (function that calls constructor; avoids `new` keyword; is lowerCamelCase instead of UpperCamelCase).

## settings.json

When Talktalk is imported via a `<script>` element, the `data-talktalk` attribute will be read to determine the directory to look for all other resources. By default, this directory is `talktalk`. In addition to containing every language's JSON file, it can include `settings.json` which further configures Talktalk. It has the following fields:

- `indicator` (string, default "#x") shows how to mark replacements within strings. Must demonstrate on the label "x".
- `fallbackLanguage` (string, default "en") is the absolute last-resort language to check for translation strings.
- `forceLanguageWithQueryParameter` (string) If set, this string will be checked in the query parameters to set the language. In case you want to let clients pick a language in the URL (as opposed to just picking with `navigator.language` and `navigator.languages`)
- `forceLanguage` (string or array) If set, this language will be forced for all users with absolute highest priority! Why would you do this it defeats the purpose of Talktalk

## RTL-compatible webpages

When the user's primary language is written right-to-left (Arabic, Farsi, Urdu, Hebrew, etc.), `document.dir` is set to "rtl". This horizontally mirrors the design of the page.

Any styling which depends on the relative horizontal location of elements should be modified to adapt to RTL layouts; namely `margin-left` should become `margin-inline-start`, and `margin-right` should become `margin-inline-end`.

If LTR text is going to be contained in the middle of a RTL element/page, you can do one of two things:

- Mark the LTR element with `dir="ltr"` to make the entire element follow LTR rules.
- If the LTR text is sitting alongside RTL text, or you only want to work with strings, you can use `Talktalk.wrapInDirectionalMarkers(text, originalLanguage)` to make sure the inner text appears according to the directionality of `originalLanguage`. If directional markers aren't needed, this function just returns the text back.

Of course, vice versa for RTL text contained in LTR elements/pages.

Test your designs. RTL languages are difficult!

## Functions you should use

Most of the functions are intended for use within Talktalk. The functions I encourage to be used are:

- `Talktalk.talk(item, replacements = {})`, which translates keys or special types into the user's language
- The functions/constructors used to create the special type classes
- `Talktalk.insertTranslations(lang, obj)`, which dynamically inserts new translations that don't appear in the JSON
- `Talktalk.displayLanguage()`, which gets the current display language (as an ISO-639 language code)
- `Talktalk.fillElements(scope = document)`, which scans the pages for (non-script) elements with the `data-talktalk` attribute to perform translations without any replacements; is automatically called on page load
- `Talktalk.wrapInQuotes(text, smart = true)`, which wraps the text in smart (or straight) quotes according to the user's language
- `Talktalk.wrapInDirectionalMarkers(text, originalLanguage)`. If the user's language matches the writing direction of the text's `originalLanguage`, returns the text back. If the directions don't match, the text is wrapped in unicode directional markers to ensure the inner text appears correctly.