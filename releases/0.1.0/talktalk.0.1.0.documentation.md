`Talktalk.indicator`
Sets the symbol used to indicate special strings (for replacement things). Defaults to "#".

`Talktalk.provide(obj)`
Provides translations to Talktalk. Indexed first by lookup key, then by language. May include

Example usage (with indicator "%"):
```js
Talktalk.provide({
	on: {
		en: "%a on %b",
		fr: "%a sur %b",
		zh: "%a在%b上"
	},
	add: {
		en: "Add color",
		fr: "Ajouter un couleur",
		zh: "添加颜色"
	},
	paste: {
		en: "Paste from clipboard",
		fr: "Coller depuis clipboard",
		zh: "剪贴板粘贴"
	},
	ratio: {
		en: "Contrast ratio: %x",
		fr: "Rapport de contraste: %x",
		zh: "对比度：%x"
	},
	bigtextwarning: {
		en: "This is only WCAG %x compliant for large text or graphical elements.",
		fr: "Ceci ne conforme à WCAG %x que pour les éléments de texte ou graphiques volumineux.",
		zh: "这仅对大型文本或图形元素符合 WCAG %x。"
	},
	title: {
		en: "Contrast checker",
		fr: "Vérificateur de contraste",
		zh: "对比度检查器"
	}
});
```

You need to provide translations before running anything that accesses translations.

`Talktalk.fillElements()`
Fills all HTML elements marked with `data-talktalk="key"` with their corresponding translation. Sets `innerText` for each element.

`Talktalk.say(key, replacements = {})`
Returns the correct string translation for a given translation key. Provided text replacements can transform marked areas of the translation key (like "%x") with the correct other text.

Example usage (with indicator "%"):
```js
Talktalk.say("ratio", {
	x: 1
})
// ^^ returns "Contrast ratio: 1" (if language is English),
// because the original key is "Contrast ratio: %x" and x
// has been replaced with 1
```