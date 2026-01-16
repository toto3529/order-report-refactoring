import path from "path"
import { readCsvFile } from "./csv/readCsvFile"
import { mapCustomers } from "./mappers/mapCustomers"
import { mapProducts } from "./mappers/mapProducts"
import { mapShippingZones } from "./mappers/mapShippingZones"

function main() {
	const base = path.join(__dirname, "..", "legacy")

	const custPath = path.join(base, "data", "customers.csv")
	const prodPath = path.join(base, "data", "products.csv")
	const shipPath = path.join(base, "data", "shipping_zones.csv")

	const customers = mapCustomers(readCsvFile(custPath))
	const products = mapProducts(readCsvFile(prodPath))
	const shippingZones = mapShippingZones(readCsvFile(shipPath))

	if (customers.length === 0) throw new Error("No customers parsed")
	if (products.length === 0) throw new Error("No products parsed")
	if (shippingZones.length === 0) throw new Error("No shipping zones parsed")
}

main()
