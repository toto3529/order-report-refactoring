import fs from "fs"

interface ReadCsvOptions {
	hasHeader?: boolean
}

export function readCsvFile(filePath: string, options: ReadCsvOptions = { hasHeader: true }): string[][] {
	const raw = fs.readFileSync(filePath, "utf-8")

	const rows = raw
		.split("\n")
		// Legacy: on garde la ligne brute (pas de trim global),
		// mais on filtre les lignes "vides" via trim()
		.filter((line) => line.trim().length > 0)
		// Legacy: split simple, sans trim des cellules (garde le \r éventuel)
		.map((line) => line.split(","))

	// Legacy: suppression de l'en-tête
	if (options.hasHeader) {
		return rows.slice(1)
	}

	return rows
}
