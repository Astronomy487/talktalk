class Talktalk {
	//settings fields
	static indicatorBefore = "#";
	static indicatorAfter = "";
	static maxRecursion = 10;
	static directory = "talktalk"; //set in script tag data-talktalk attribute!
	static checkedSettingsJsonYet = false;
	static checkSettingsJson() {
		if (Talktalk.checkedSettingsJsonYet) return;
		//everything below is only ever executed once
		let xhr = new XMLHttpRequest();
		xhr.open("GET", Talktalk.directory + "/settings.json", false);
		try {
			xhr.send(null);
			if (xhr.status == 200) {
				try {
					let json = JSON.parse(xhr.responseText);
					if (json.indicator && typeof(json.indicator)=="string" && json.indicator.includes("x")) {
						[Talktalk.indicatorBefore, Talktalk.indicatorAfter] = json.indicator.split("x");
					}
					if (json.fallbackLanguage && json.fallbackLanguage != "en") {
						Talktalk.fallbackLanguage = json.fallbackLanguage;
						Talktalk.setupLangPreferences();
					}
					try { if (json.forceLanguageWithQueryParameter && typeof(json.forceLanguageWithQueryParameter) == "string") {
						Talktalk.forcedLanguages = new URLSearchParams(window.location.search).get(json.forceLanguageWithQueryParameter).split(",");
					} } catch(e) {} //wrap in extra trycatch because maybe the parameter isn't there
					if (json.forceLanguage) {
						if (typeof(json.forceLanguage) == "string") json.forceLanguage = json.forceLanguage.split(",");
						Talktalk.forcedLanguages = json.forceLanguage.concat(...Talktalk.forcedLanguages);
					}
					if (json.maxRecursion && typeof json.maxRecursion == "number") Talktalk.maxRecursion = json.maxRecursion;
				} catch(e) {
					console.log("Incorrectly formatted JSON found in "+lang+".json!\n" + e);
				}
			} else {
				throw "Error loading settings JSON: " + xhr.status + " " + xhr.statusText; //it's fine if it doesn't exist
			}
		} catch (e) {
		}
		Talktalk.checkedSettingsJsonYet = true;
	}
	//utility functions
	static wrapInIndicator(x) {
		return Talktalk.indicatorBefore + x + Talktalk.indicatorAfter;
	}
	static space(lang) {
		if (lang) return findSpace(lang);
		for (let lang of Talktalk.langs) return findSpace(lang);
		function findSpace(lang) {
			lang = Talktalk.shortLang(lang);
			if (["ja", "zh", "lo", "my"].includes(lang)) return "";
			return " ";
		}
	}
	static shortLang(lang) {
		if (lang.includes("-")) lang = lang.substring(0, lang.indexOf("-"));
		return lang;
	}
	static writingDirection(lang) {
		if (lang == "rtl" || lang == "ltr") return lang;
		if (lang) return findWritingDirection(lang);
		for (let lang of Talktalk.langs) return findWritingDirection(lang);
		function findWritingDirection(lang) {
			lang = Talktalk.shortLang(lang);
			if (["ar", "arc", "az", "dhivehi", "ff", "he", "ku", "nqo", "fa", "rhg", "syc", "syr", "ur"].includes(lang)) return "rtl";
			return "ltr";
		}
	}
	static quoteStrings = { //filled programmatically later
		smart: { left: {}, right: {} },
		straight: { left: {}, right: {} }
	}
	static wrapInQuotes(text, levels = 0, smart = true) {
		let quotesObject = smart ? Talktalk.quoteStrings.smart : Talktalk.quoteStrings.straight;
		let left = undefined;
		for (let lang of Talktalk.langs) if (!left) if (lang in quotesObject.left) {
			left = quotesObject.left[lang];
			break;
		}
		left ||= quotesObject.left.en;
		let right = undefined;
		for (let lang of Talktalk.langs) if (!right) if (lang in quotesObject.right) {
			right = quotesObject.right[lang];
			break;
		}
		right ||= quotesObject.right.en;
		return left[levels%left.length] + text + right[levels%right.length];
	}
	static wrapInDirectionalMarkers(text, originalLanguage = "ltr") { //note - does not apply lang attribute to inner elements
		//if originalLanguage != user's writing direction, wrap text in the appropriate directional writing markers
		let innerDirection = Talktalk.writingDirection(originalLanguage);
		let outerDirection = Talktalk.writingDirection();
		if (innerDirection == outerDirection) return text;
		if (innerDirection == "ltr") return "\u2066" + text + "\u2069";
		if (innerDirection == "rtl") return "\u2067" + text + "\u2069";
		return text;
	}
	static getPluralitySequence(number) {
		let plurality = undefined;
		findPluralityRule:
		for (let lang of Talktalk.langs) {
			plurality = new Intl.PluralRules(lang).select(number);
			break findPluralityRule;
		}
		if (plurality == undefined) throw "";
		let sequence = {
			zero: ["zero", "none", "other"],
			one: ["one", "singular", "other"],
			two: ["two", "dual", "few", "paucal", "many", "plural", "other"],
			few: ["few", "paucal", "many", "plural", "other"],
			many: ["many", "plural", "other"],
			other: ["many", "plural", "other"]
		}[plurality];
		//force a few special ones at the start (english doesn't have dual, but maybe you want a dual anyways!)
		for (let [condition, newInclusions] of [
			[number<0, ["negative"]],
			[number==0, ["zero", "none"]],
			[Math.abs(number)==1, ["one", "singular"]],
			[Math.abs(number)==2, ["two", "dual"]],
			[Math.round(number)!=number, ["fractional"]]
		]) if (condition) for (let inclusion of newInclusions) if (!sequence.includes(inclusion)) sequence.unshift(inclusion);
		return sequence;
	}
	//setting languages and support
	static langs = [];
	static translations = {};
	static readLangs = {}; //languages that have already been passed to readLangJson
	static supportedLanguage(lang) {
		//checks if .json for this language existed (en-US returns true, even if only en.json exists)
		lang = Talktalk.shortLang(lang);
		if (!Talktalk.readLangs[lang]) Talktalk.readLangJson(lang);
		return (lang in Talktalk.translations) ? true : false;
	}
	static readLangJson(lang) {
		Talktalk.checkSettingsJson();
		let xhr = new XMLHttpRequest();
		xhr.open("GET", Talktalk.directory + "/" + lang + ".json", false);
		Talktalk.readLangs[lang] = true;
		try {
			xhr.send(null);
			if (xhr.status == 200) {
				try {
					let json = JSON.parse(xhr.responseText);
					Talktalk.insertTranslations(lang, json);
				} catch(e) {
					console.log("Incorrectly formatted JSON found in "+lang+".json!\n" + e);
				}
			} else {
				throw "Error loading translations: " + xhr.status + " " + xhr.statusText;
			}
		} catch (e) {
		}
	}
	static insertTranslations(lang, obj) {
		if (!(lang in Talktalk.translations)) Talktalk.translations[lang] = {};
		for (let key in obj) {
			Talktalk.translations[lang][key] = obj[key];
		}
	}
	static displayLanguage() {
		for (let lang of Talktalk.langs) if (Talktalk.supportedLanguage(lang)) return lang;
		throw "Somehow no language is supported (?)";
	}
	static fallbackLanguage = "en";
	static forcedLanguages = [];
	static setupLangPreferences() {
		Talktalk.checkSettingsJson();
		try {
			Talktalk.forceLanguage((navigator.languages||[]).concat(navigator.language));
		} catch(e) {
			Talktalk.langs = [Talktalk.fallbackLanguage];
		}
	}
	static forceLanguage(entries) { //entries is array of language codes with no guaranteed fallbacks provided
		if (typeof entries == "string") entries = [entries];
		if (!Array.isArray(entries)) return;
		entries.push(Talktalk.fallbackLanguage);
		Talktalk.langs = [];
		Talktalk.translations = {};
		Talktalk.readLangs = {};
		Talktalk.langsActuallySupported = {};
		for (let source of Talktalk.forcedLanguages.concat(...entries)) if (source) {
			source = source.split("-");
			while (source.length) {
				let that = source.join("-");
				if (!Talktalk.langs.includes(that)) if (Talktalk.supportedLanguage(that)) {
					Talktalk.langs.push(that);
				}
				source.pop();
			}	
		}
		if (Talktalk.langs.length == 0) Talktalk.langs = [Talktalk.fallbackLanguage];
		//other things that need to happen once we've decided on language
		document.dir = Talktalk.writingDirection();
		document.querySelector("html").setAttribute("lang", Talktalk.displayLanguage());
	}
	//main text lookup functions
	static readTranslationKey(key, requirement = undefined) {
		for (let lang of Talktalk.langs) {
			if (requirement) if ((lang!=requirement)&&!lang.startsWith(requirement+"-")) continue;
			if (!Talktalk.readLangs[lang]) Talktalk.readLangJson(lang);
			if (lang in Talktalk.translations) {
				if (key in Talktalk.translations[lang]) return Talktalk.translations[lang][key];
			}
		}
		throw "Could not translate key '"+key+"' into any language";
	}
	static talk(key, replacements = {}, recursionLevel = 0) {
		if (recursionLevel > Talktalk.maxRecursion) throw "Too much recursion";
		if (Talktalk.isSpecialType(key)) return Talktalk.handleSpecialTypes(key, replacements);
		let text = Talktalk.readTranslationKey(key);
		if (Array.isArray(text)) return text.map(x => Talktalk.handleTranslatedText(x, replacements, recursionLevel+1)).join(Talktalk.space());
		if (Talktalk.isSpecialType(text)) return Talktalk.handleSpecialTypes(text, replacements);
		return Talktalk.handleTranslatedText(text, replacements, recursionLevel+1);
	}
	static handleTranslatedText(text, replacements, recursionLevel) {
		if (recursionLevel > Talktalk.maxRecursion) throw "Too much recursion";
		//look for what replacements we will have to make (among labels, which labels are actually in this string? and if text is object, make sure to search each)
		//(replacements might map to numbers and dates!)
		let replacementsToMake = {};
		for (let key in replacements) {
			let keyWrapped = Talktalk.wrapInIndicator(key);
			for (let txt of (text.constructor==Object ? Object.values(text) : [text])) {
				if (Array.isArray(txt)) txt = txt.join("\n");
				if (txt.includes(keyWrapped)) replacementsToMake[keyWrapped] = replacements[key];
			}
		}
		//if it is array object, get all of them
		if (Array.isArray(text)) return text.map(x => Talktalk.handleTranslatedText(x, replacements, recursionLevel+1)).join(" ");
		//if is plural object, get the right one
		if (text.constructor == Object) {
			let numbersUsed = Object.values(replacementsToMake).filter(x => typeof(x) == "number");
			if (numbersUsed.length == 0) throw "Using plural translation text "+JSON.stringify(text)+" but wasn't given a number";
			if (numbersUsed.length != 1) throw "Using plural translation text "+JSON.stringify(text)+" but was given more than one number";
			let pluralSequence = Talktalk.getPluralitySequence(numbersUsed[0]);
			for (let key of pluralSequence) if (key in text) {
				text = text[key];
				break;
			}
			if (text.constructor == Object) throw "Using plural translation text " + JSON.stringify(text) + " but number " + numbersUsed[0] + " gave plural sequence " + pluralSequence.join(", ");
		}
		//if it is array object, get all of them
		if (Array.isArray(text)) return text.map(x => Talktalk.handleTranslatedText(x, replacements, recursionLevel+1)).join(Talktalk.space());
		//replacement time!
		for (let keyWrapped in replacementsToMake) {
			let newText = replacementsToMake[keyWrapped];
			if (Talktalk.isSpecialType(newText)) newText = Talktalk.handleSpecialTypes(newText, replacements);
			else if (typeof newText != "string") throw "Cannot use replacement '"+newText+"' of type " + typeof(newText);
			text = text.replaceAll(keyWrapped, newText);
		}
		return text;
	}
	//handling special types
	static isSpecialType(x) {
		if (typeof x == "string") return false;
		if (typeof x == "number") return true;
		if (Array.isArray(x)) return true;
		if (x instanceof Date) return true;
		if (x instanceof Talktalk.Duration) return true;
		if (x instanceof Talktalk.Language) return true;
		if (x instanceof Talktalk.Region) return true;
		if (x instanceof Talktalk.Script) return true;
		if (x instanceof Talktalk.Currency) return true;
		if (x instanceof Talktalk.Calendar) return true;
		if (x instanceof Talktalk.DateTimeField) return true;
		if (x instanceof Talktalk.TimeOfDay) return true;
		if (x instanceof Talktalk.AmountOfMoney) return true;
		if (x instanceof Talktalk.AmountOfUnit) return true;
		if (x instanceof Talktalk.RelativeTime) return true;
		return false;
	}
	static specialTypesFormatFields = {
		date: [
			"calendar", "numberFormat", "hour12", "hourCycle", "timeZone",
			"weekday", "era", "year", "month", "day", "dayPeriod",
			"hour", "minute", "second", "fractionalSecondDigits", "timeZoneName"
		],
		timeOfDay: [ //another date. just useful if you want to keep their settings separately
			"calendar", "numberFormat", "hour12", "hourCycle", "timeZone",
			"weekday", "era", "year", "month", "day", "dayPeriod",
			"hour", "minute", "second", "fractionalSecondDigits", "timeZoneName"
		],
		number: [
			"numberingSystem", "style", "currency", "currencyDisplay", "currencySign", "unit", "unitDisplay",
			"minimumIntegerDigits", "minimumFractionDigits", "maximumFractionDigits", "minimumSignificantDigits", "maximumSignificantDigits",
			"roundingPriority", "roundingIncrement", "roundingMode", "trailingZeroDisplay",
			"notation", "compactDisplay", "useGrouping", "signDisplay"
		],
		amountOfMoney: [
			"numberingSystem", "currencyDisplay", "currencySign",
			"minimumIntegerDigits", "minimumFractionDigits", "maximumFractionDigits", "minimumSignificantDigits", "maximumSignificantDigits",
			"roundingPriority", "roundingIncrement", "roundingMode", "trailingZeroDisplay",
			"notation", "compactDisplay", "useGrouping", "signDisplay"
		],
		amountOfUnit: [
			"numberingSystem", "unitDisplay",
			"minimumIntegerDigits", "minimumFractionDigits", "maximumFractionDigits", "minimumSignificantDigits", "maximumSignificantDigits",
			"roundingPriority", "roundingIncrement", "roundingMode", "trailingZeroDisplay",
			"notation", "compactDisplay", "useGrouping", "signDisplay"
		],
		duration: [
			"numberingSystem", "style", "years", "yearsDisplay", "months", "monthsDisplay", "weeks", "weekDisplay",
			"days", "daysDisplay", "hours", "hoursDisplay", "minutes", "minutesDisplay", "seconds", "secondsDisplay",
			"milliseconds", "millisecondsDisplay", "microseconds", "microsecondsDisplay", "nanoseconds", "nanosecondsDisplay",
			"fractionalDigits"
		],
		language: [
			"style", "fallback", "languageDisplay"
		],
		region: [
			"style", "fallback"
		],
		script: [
			"style", "fallback"
		],
		currency: [
			"style", "fallback"
		],
		calendar: [
			"style", "fallback"
		],
		dateTimeField: [
			"style", "fallback"
		],
		list: [
			"type", "style"
		],
		relativeTime: [
			"numberingSystem", "style", "numeric"
		]
	};
	static handleSpecialTypes(x, settings) { //handle dates, numbers. if not special, throw so
		function handleSpecialTypesAlgorithm(prefix, constructor, defaultSettings, selectorName, ...args) {
			try {
				for (let lang of Talktalk.langs) {
					let shortLang = Talktalk.shortLang(lang);
					let formatSettings = defaultSettings;
					for (let becomes of Talktalk.specialTypesFormatFields[prefix]) {
						let lookFor = prefix + ":" + becomes;
						if (lookFor in settings) formatSettings[becomes] = settings[lookFor];
						else try {
							let read = Talktalk.readTranslationKey(lookFor, shortLang);
							if (typeof read != "string") throw lang+" settings for " + lookFor + " isn't a string. Why would you do that";
							formatSettings[becomes] = read;
						} catch(e) {}
					}
					return new constructor(lang, formatSettings)[selectorName](...args);
				}
			} catch(e) {
				return x.toString();
			}
		}
		if (typeof x == "number") {
			return handleSpecialTypesAlgorithm("number", Intl.NumberFormat, {}, "format", x);
		}
		if (Array.isArray(x)) {
			x = x.map(item => Talktalk.isSpecialType(item) ? Talktalk.handleSpecialTypes(item) : item);
			return handleSpecialTypesAlgorithm("list", Intl.ListFormat, {}, "format", x);
		}
		if (x instanceof Date) {
			return handleSpecialTypesAlgorithm("date", Intl.DateTimeFormat, {}, "format", x);
		}
		if (x instanceof Talktalk.Duration) {
			return handleSpecialTypesAlgorithm("duration", Intl.DurationFormat, {}, "format", x);
		}
		if (x instanceof Talktalk.TimeOfDay) {
			return handleSpecialTypesAlgorithm("timeOfDay", Intl.DateTimeFormat, {hour: "numeric", minute: "2-digit"}, "format", x.date);
		}
		if (x instanceof Talktalk.AmountOfMoney) {
			return handleSpecialTypesAlgorithm("amountOfMoney", Intl.NumberFormat, {style: "currency", currency: x.code}, "format", x.amount);
		}
		if (x instanceof Talktalk.AmountOfUnit) {
			return handleSpecialTypesAlgorithm("amountOfUnit", Intl.NumberFormat, {style: "unit", unit: x.code, unitDisplay: "long"}, "format", x.amount);
		}
		if (x instanceof Talktalk.RelativeTime) {
			return handleSpecialTypesAlgorithm("relativeTime", Intl.RelativeTimeFormat, {numeric: "auto"}, "format", x.amount, x.unit);
		}
		//a bunch of ones that all use Intl.DisplayNames and Talktalk.* objects that just wrap a .code
		for (let [constructor, text] of [
			[Talktalk.Language, "language"],
			[Talktalk.Region, "region"],
			[Talktalk.Script, "script"],
			[Talktalk.Currency, "currency"],
			[Talktalk.Calendar, "calendar"],
			[Talktalk.DateTimeField, "dateTimeField"]
		]) {
			if (x instanceof constructor) {
				return handleSpecialTypesAlgorithm(text, Intl.DisplayNames, {type: text}, "of", x.code);
			}
		}
		throw x + " is not a special type";
	}
	static fillElements(scope = document) {
		for (let element of scope.querySelectorAll("[data-talktalk]")) if (element.tagName.toLowerCase() != "script") {
			try {
				element.innerText = Talktalk.talk(element.getAttribute("data-talktalk"));
				element.removeAttribute("data-talktalk");
			} catch(e) {}
		}
	}
	//the actual classes for the special types
	static Duration = class {
		constructor(...args) {
			if (typeof args[0] == "string") {
				//https://stackoverflow.com/questions/14934089/convert-iso-8601-duration-with-javascript
				let matches = args[0].match(/(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?(?:T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?)?/);
				if (matches[1]) this.sign = (matches[1]=="+"?1:-1);
				if (matches[2]) this.years = parseFloat(matches[2]);
				if (matches[3]) this.months = parseFloat(matches[3]);
				if (matches[4]) this.weeks = parseFloat(matches[4]);
				if (matches[5]) this.days = parseFloat(matches[5]);
				if (matches[6]) this.hours = parseFloat(matches[6]);
				if (matches[7]) this.minutes = parseFloat(matches[7]);
				if (matches[8]) this.seconds = parseFloat(matches[8]);
			} else if (typeof args[0] == "number" && args[1]) {
				if (!["years", "months", "weeks", "days", "hours", "minutes", "seconds"].includes(args[1])) return false;
				this[args[1]] = args[0];
			} else if (typeof args[0] == "number") {
				if (args[0] < 0) {
					this.sign = -1;
					args[0] *= -1;
				}
				let seconds = args[0]%60;
				let minutes = Math.floor(args[0]/60)%60;
				let hours = Math.floor(args[0]/3600)%24;
				let days = Math.floor(args[0]/86400);
				if (seconds) this.seconds = seconds;
				if (minutes) this.minutes = minutes;
				if (hours) this.hours = hours;
				if (days) this.days = days;
			} else throw "I don't know how to make a Talktalk.Duration out of " + args;
		}
	}
	static RelativeTime = class {
		constructor(amount, unit) {
			if (typeof amount != "number" || typeof unit != "string") throw "I don't know how to make a Talktalk.RelativeTime out of " + amount + " " + unit;
			this.amount = amount;
			this.unit = unit;
		}
	}
	static Language = class {constructor(code) {this.code = code;}}
	static Region = class {constructor(code) {this.code = code;}}
	static Script = class {constructor(code) {this.code = code;}}
	static Currency = class {constructor(code) {this.code = code;}}
	static Calendar = class {constructor(code) {this.code = code;}}
	static DateTimeField = class {constructor(code) {this.code = code;}}
	static TimeOfDay = class { //just a nice wrapper for Dates, really
		constructor(...args) {
			if (args[0] == undefined) {
				this.date = new Date();
			} else if (args[0] instanceof Date) {
				this.date = args[0];
			} else if (typeof args[0] == "string") {
				this.date = new Date(args[0]);
			} else throw "Couldn't turn " + args + " into a Talktalk.TimeOfDay";
		}
	}
	static AmountOfMoney = class {
		constructor(number, code) {
			if (typeof number != "number" || typeof code != "string") throw "Talktalk.AmountOfMoney must be created with number and string; you gave me " + number + " and " + code;
			this.amount = number;
			this.code = code;
		}
	}
	static AmountOfUnit = class {
		constructor(number, code) {
			if (typeof number != "number" || typeof code != "string") throw "Talktalk.AmountOfUnit must be created with number and string; you gave me " + number + " and " + code;
			this.amount = number;
			this.code = code;
		}
	}
}

for (let className of ["Duration", "Language", "Region", "Script", "Currency", "Calendar", "DateTimeField", "TimeOfDay", "AmountOfMoney", "AmountOfUnit", "RelativeTime"]) {
	Talktalk[className[0].toLowerCase() + className.substring(1)] = function(...args) {return new Talktalk[className](...args);}
	Talktalk[className].prototype.talk = function(replacements) {
		return Talktalk.talk(this, replacements);
	}
}

try {
	let script = document.querySelector("script[data-talktalk]");
	Talktalk.directory = script.getAttribute("data-talktalk");
} catch(e) {}

Talktalk.setupLangPreferences();

document.addEventListener("DOMContentLoaded", function() {
	Talktalk.fillElements();
});

//programmatically fill quoteStrings
for (let [open, close, followers] of [
	[["“", "‘"], ["”", "’"], "en"], //fallback
	[["‘", "“"], ["’", "”"], "en-GB en-IE ga"], //british english style, single
	[["„", "‚"], ["“", "‘"], "de cs sl lt et bg is"], //german style
	[["«\u00a0", "“", "‘"], ["\u00a0»", "”", "’"], "fr"], //french style, spaces
	[["«", "“", "‘"], ["»", "”", "’"], "es-ES pt-PT it de-CH lv nn nb no el ko-KP tr az hy mn fa uz kk"], //french style, no space
	[["«", "„"], ["»", "“"], "ru be uk"],
	[["„", "‚"], ["”", "’"], "nl hr bs sr ro mk sq cnr ka"], //eastern style
	[["„", "«"], ["”", "»"], "ro"],
	[["„", "»", "’"], ["”", "«", "’"], "hu"],
	[["„", "»", "‘"], ["”", "«", "’"], "pl"],
	[["»", "›"], ["«", "‹"], "da"],
	[["”", "’"], ["”", "’"], "fi sv"],
	[["「", "『"], ["」", "』"], "ja zh-Hant"],
	[["”", "‘"], ["“", "’"], "ar arc az dhivehi ff he ku nqo rhg syc syr ur"], //rtl (farsi is fine with guillimets)
]) {
	let smartToStraight = {
		"“": "\"",
		"‘": "'",
		"”": "\"",
		"’": "'",
		"„": "„",
		"‚": "‚"
	};
	for (let lang of followers.split(" ")) {
		Talktalk.quoteStrings.smart.left[lang] = open;
		Talktalk.quoteStrings.smart.right[lang] = close;
		Talktalk.quoteStrings.straight.left[lang] = open.map(function(smart){
			if (smart in smartToStraight) return smartToStraight[smart];
			return smart;
		});
		Talktalk.quoteStrings.straight.right[lang] = close.map(function(smart){
			if (smart in smartToStraight) return smartToStraight[smart];
			return smart;
		});
	}
}