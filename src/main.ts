import path from "path"
import { readCsvFile } from "./csv/readCsvFile"

function main() {
	const base = path.join(__dirname, "..", "legacy")
	const custPath = path.join(base, "data", "customers.csv")

	const customersRows = readCsvFile(custPath)

	// Vérif simple : lecture de quelque chose
	if (customersRows.length === 0) {
		throw new Error("customers.csv is empty or could not be parsed")
	}
}

main()
