import path from "path"
import { readCsvFile } from "./csv/readCsvFile"
import { mapCustomers } from "./mappers/mapCustomers"
import { mapProducts } from "./mappers/mapProducts"
import { mapShippingZones } from "./mappers/mapShippingZones"
import { mapPromotions } from "./mappers/mapPromotions"
import { mapOrders } from "./mappers/mapOrders"

function indexByKey<T, K extends keyof T>(items: T[], key: K): Record<string, T> {
	const index: Record<string, T> = {}

	for (const item of items) {
		const k = item[key]
		if (typeof k !== "string") {
			throw new Error(`indexByKey expects a string key, got ${typeof k}`)
		}
		index[k] = item
	}

	return index
}

function groupOrdersByCustomerId(orders: { customerId: string }[]): Record<string, typeof orders> {
	const grouped: Record<string, typeof orders> = {}
	for (const o of orders) {
		const cid = o.customerId
		if (!grouped[cid]) grouped[cid] = []
		grouped[cid].push(o)
	}
	return grouped
}

export function run(): string {
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

	const customersById = indexByKey(customers, "id")
	const productsById = indexByKey(products, "id")
	const shippingZonesByZone = indexByKey(shippingZones, "zone")
	const promotionsByCode = indexByKey(promotions, "code")

	const ordersByCustomerId = groupOrdersByCustomerId(orders)

	// Étape 2 : on prépare les index/groupements, mais on ne génère pas encore le report.
	return ""
}
