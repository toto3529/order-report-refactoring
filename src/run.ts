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

	type CustomerTotals = {
		subtotal: number
		weight: number
		items: typeof orders
		morningBonus: number
	}

	const totalsByCustomer: Record<string, CustomerTotals> = {}

	for (const o of orders) {
		const cid = o.customerId

		const prod = productsById[o.productId]
		const basePrice = prod ? prod.price : o.unitPrice

		// Promo (legacy)
		let discountRate = 0
		let fixedDiscount = 0

		if (o.promoCode) {
			const promo = promotionsByCode[o.promoCode]
			if (promo && promo.active) {
				const promoValue = Number(promo.value)
				if (promo.type === "PERCENTAGE") {
					discountRate = promoValue / 100
				} else if (promo.type === "FIXED") {
					fixedDiscount = promoValue
				}
			}
		}

		let lineTotal = o.qty * basePrice * (1 - discountRate) - fixedDiscount * o.qty

		// Morning bonus (legacy)
		const hour = parseInt(o.time.split(":")[0])
		let morningBonus = 0
		if (hour < 10) {
			morningBonus = lineTotal * 0.03
		}
		lineTotal = lineTotal - morningBonus

		if (!totalsByCustomer[cid]) {
			totalsByCustomer[cid] = {
				subtotal: 0,
				weight: 0,
				items: [],
				morningBonus: 0,
			}
		}

		totalsByCustomer[cid].subtotal += lineTotal
		totalsByCustomer[cid].weight += ((prod?.weight ?? 1.0) as number) * o.qty
		totalsByCustomer[cid].items.push(o)
		totalsByCustomer[cid].morningBonus += morningBonus
	}

	return ""
}
