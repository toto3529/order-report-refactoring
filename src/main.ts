import path from "path"
import { readCsvFile } from "./csv/readCsvFile"
import { mapCustomers } from "./mappers/mapCustomers"

function main() {
	const base = path.join(__dirname, "..", "legacy")
	const custPath = path.join(base, "data", "customers.csv")

	const customersRows = readCsvFile(custPath)
	const customers = mapCustomers(customersRows)

	if (customers.length === 0) {
		throw new Error("customers.csv is empty or could not be parsed")
	}
}

main()
