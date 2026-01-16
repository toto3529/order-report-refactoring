import fs from "fs"

export function readCsvFile(filePath: string): string[][] {
	const raw = fs.readFileSync(filePath, "utf-8")

	return raw
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => line.split(",").map((cell) => cell.trim()))
}
