import path from "path"
import { readCsvFile } from "./csv/readCsvFile"
import { mapCustomers } from "./mappers/mapCustomers"
import { mapProducts } from "./mappers/mapProducts"
import { mapShippingZones } from "./mappers/mapShippingZones"
import { mapPromotions } from "./mappers/mapPromotions"
import { mapOrders } from "./mappers/mapOrders"
import { applyMaxDiscountCap, computeLoyaltyDiscount, computeLoyaltyPointsByCustomer, computeVolumeDiscount } from "./calculations/discounts"
import { HANDLING_FEE, SHIPPING_LIMIT, TAX } from "./constants/business"

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

	const loyaltyPointsByCustomerId = computeLoyaltyPointsByCustomer(orders)

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

	const outputLines: string[] = []
	let grandTotal = 0.0
	let totalTaxCollected = 0.0

	// Legacy: tri par ID client
	const sortedCustomerIds = Object.keys(totalsByCustomer).sort()

	for (const cid of sortedCustomerIds) {
		const cust = customersById[cid]
		const name = cust?.name ?? "Unknown"
		const level = cust?.level ?? "BASIC"
		const zone = cust?.zone ?? "ZONE1"
		const currency = cust?.currency ?? "EUR"

		const sub = totalsByCustomer[cid].subtotal
		const weight = totalsByCustomer[cid].weight
		const items = totalsByCustomer[cid].items
		const itemCount = items.length

		// --- Discounts (legacy) ---
		const firstOrderDate = items[0]?.date ?? ""
		let volumeDiscount = computeVolumeDiscount(sub, level, firstOrderDate)

		const pts = loyaltyPointsByCustomerId[cid] ?? 0
		let loyaltyDiscount = computeLoyaltyDiscount(pts)

		const capped = applyMaxDiscountCap(volumeDiscount, loyaltyDiscount)
		const totalDiscount = capped.totalDiscount
		volumeDiscount = capped.volumeDiscount
		loyaltyDiscount = capped.loyaltyDiscount

		// --- Tax (legacy) ---
		const taxable = sub - totalDiscount

		let allTaxable = true
		for (const item of items) {
			const prod = productsById[item.productId]
			// ⚠️ Ajuste ici si le champ s’appelle autrement que taxable
			if (prod && prod.taxable === false) {
				allTaxable = false
				break
			}
		}

		let tax = 0.0
		if (allTaxable) {
			tax = Math.round(taxable * TAX * 100) / 100
		} else {
			for (const item of items) {
				const prod = productsById[item.productId]
				if (prod && prod.taxable !== false) {
					// Legacy bug: base sur qty * (prod.price || item.unitPrice), ignore promos/morning bonus
					const itemTotal = item.qty * (prod.price ?? item.unitPrice)
					tax += itemTotal * TAX
				}
			}
			tax = Math.round(tax * 100) / 100
		}

		// --- Shipping (legacy) ---
		let ship = 0.0

		if (sub < SHIPPING_LIMIT) {
			const shipZone = shippingZonesByZone[zone] ?? {
				zone,
				base: 5.0,
				// ⚠️ Ajuste ici si perKg s’appelle per_kg
				perKg: 0.5,
			}

			const baseShip = shipZone.base

			if (weight > 10) {
				ship = baseShip + (weight - 10) * shipZone.perKg
			} else if (weight > 5) {
				ship = baseShip + (weight - 5) * 0.3
			} else {
				ship = baseShip
			}

			if (zone === "ZONE3" || zone === "ZONE4") {
				ship = ship * 1.2
			}
		} else {
			if (weight > 20) {
				ship = (weight - 20) * 0.25
			}
		}

		// --- Handling (legacy) ---
		let handling = 0.0
		if (itemCount > 10) handling = HANDLING_FEE
		if (itemCount > 20) handling = HANDLING_FEE * 2

		// --- Currency conversion (legacy) ---
		let currencyRate = 1.0
		if (currency === "USD") currencyRate = 1.1
		else if (currency === "GBP") currencyRate = 0.85

		const total = Math.round((taxable + tax + ship + handling) * currencyRate * 100) / 100
		grandTotal += total
		totalTaxCollected += tax * currencyRate

		// --- Output lines (legacy format) ---
		outputLines.push(`Customer: ${name} (${cid})`)
		outputLines.push(`Level: ${level} | Zone: ${zone} | Currency: ${currency}`)
		outputLines.push(`Subtotal: ${sub.toFixed(2)}`)
		outputLines.push(`Discount: ${totalDiscount.toFixed(2)}`)
		outputLines.push(`  - Volume discount: ${volumeDiscount.toFixed(2)}`)
		outputLines.push(`  - Loyalty discount: ${loyaltyDiscount.toFixed(2)}`)
		if (totalsByCustomer[cid].morningBonus > 0) {
			outputLines.push(`  - Morning bonus: ${totalsByCustomer[cid].morningBonus.toFixed(2)}`)
		}
		outputLines.push(`Tax: ${(tax * currencyRate).toFixed(2)}`)
		outputLines.push(`Shipping (${zone}, ${weight.toFixed(1)}kg): ${ship.toFixed(2)}`)
		if (handling > 0) {
			outputLines.push(`Handling (${itemCount} items): ${handling.toFixed(2)}`)
		}
		outputLines.push(`Total: ${total.toFixed(2)} ${currency}`)
		outputLines.push(`Loyalty Points: ${Math.floor(pts)}`)
		outputLines.push("")
	}

	outputLines.push(`Grand Total: ${grandTotal.toFixed(2)} EUR`)
	outputLines.push(`Total Tax Collected: ${totalTaxCollected.toFixed(2)} EUR`)

	return outputLines.join("\n")
}
