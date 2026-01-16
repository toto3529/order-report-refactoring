import path from "path"
import { readCsvFile } from "./csv/readCsvFile"
import { mapCustomers } from "./mappers/mapCustomers"
import { mapProducts } from "./mappers/mapProducts"
import { mapShippingZones } from "./mappers/mapShippingZones"
import { mapPromotions } from "./mappers/mapPromotions"
import { mapOrders } from "./mappers/mapOrders"

function main() {
	const base = path.join(__dirname, "..", "legacy")

	const custPath = path.join(base, "data", "customers.csv")
	const prodPath = path.join(base, "data", "products.csv")
	const shipPath = path.join(base, "data", "shipping_zones.csv")
	const promoPath = path.join(base, "data", "promotions.csv")
	const ordPath = path.join(base, "data", "orders.csv")

	const customers = mapCustomers(readCsvFile(custPath))
	const products = mapProducts(readCsvFile(prodPath))
	const shippingZones = mapShippingZones(readCsvFile(shipPath))
	const promotions = mapPromotions(readCsvFile(promoPath))
	const orders = mapOrders(readCsvFile(ordPath))

	if (customers.length === 0) throw new Error("No customers parsed")
	if (products.length === 0) throw new Error("No products parsed")
	if (shippingZones.length === 0) throw new Error("No shipping zones parsed")
	if (promotions.length === 0) throw new Error("No promotions parsed")
	if (orders.length === 0) throw new Error("No orders parsed")
}

main()
