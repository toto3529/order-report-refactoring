import fs from "fs"

interface ReadCsvOptions {
	hasHeader?: boolean
}

export function readCsvFile(filePath: string, options: ReadCsvOptions = { hasHeader: true }): string[][] {
	const raw = fs.readFileSync(filePath, "utf-8")

	const rows = raw
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => line.split(",").map((cell) => cell.trim()))

	// Suppression propre de la ligne d’en-tête à chaque fichier csv
	if (options.hasHeader) {
		return rows.slice(1)
	}

	return rows
}
