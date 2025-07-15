class Talktalk {
	static translations = {};
	static indicator = "#";
	static langPrefs = ["en"];
	static provide(obj) {
		for (let key in obj) {
			Talktalk.translations[key] = obj[key];
		}
	}
	static setupLangPrefs() {
		try {
			Talktalk.langPrefs = [];
			for (let source of (navigator.languages||[]).concat(navigator.language)) {
				source = source.split("-");
				while (source.length) {
					let that = source.join("-");
					if (!Talktalk.langPrefs.includes(that)) Talktalk.langPrefs.push(that);
					source.pop();
				}
			}
			if (Talktalk.langPrefs.length == 0) throw "";
		} catch(e) {
			Talktalk.langPrefs = ["en"];
		}
	}
	static readTranslationKey(key) {
		for (let lang of Talktalk.langPrefs) if (lang in Talktalk.translations[key]) return Talktalk.translations[key][lang];
		throw "Could not translate key '"+key+"'"
	}
	static handleNumber(number) {
		
	}
	static handleDate() {
		
	}
	static handleDuration() {
		
	}
	static say(key, replacements = {}) {
		//todo - if key is a number or date, translate it
		let text = Talktalk.readTranslationKey(key);
		for (let label in replacements) {
			if (!text.includes(Talktalk.indicator + label)) throw "Translated text '"+text+"' doesn't have '" + Talktalk.indicator + label + "'";
			let newText = replacements[label];
			if (typeof(newText) == "string") {
				if (newText.startsWith(Talktalk.indicator)) newText = Talktalk.say(newText.substring(Talktalk.indicator.length));
			} else {
				throw "TODO - handle numbers and dates and stuff"
			}
			text = text.replace(Talktalk.indicator + label, newText);
		}
		return text;
	}
	static fillElements(scope = document) {
		for (let element of scope.querySelectorAll("[data-talktalk]")) {
			try {
				element.innerText = Talktalk.say(element.getAttribute("data-talktalk"));
				element.removeAttribute("data-talktalk");
			} catch(e) {}
		}
	}
}
Talktalk.setupLangPrefs();