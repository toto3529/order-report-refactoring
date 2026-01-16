import path from "path"
import { readCsvFile } from "./csv/readCsvFile"
import { mapCustomers } from "./mappers/mapCustomers"
import { mapProducts } from "./mappers/mapProducts"

function main() {
	const base = path.join(__dirname, "..", "legacy")

	const custPath = path.join(base, "data", "customers.csv")
	const prodPath = path.join(base, "data", "products.csv")

	const customers = mapCustomers(readCsvFile(custPath))
	const products = mapProducts(readCsvFile(prodPath))

	if (customers.length === 0) throw new Error("No customers parsed")
	if (products.length === 0) throw new Error("No products parsed")
}

main()
