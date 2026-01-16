import { Customer, CustomerLevel } from "../models/Customers"

function isCustomerLevel(value: string): value is CustomerLevel {
	return value === "BASIC" || value === "PREMIUM"
}

export function mapCustomers(rows: string[][]): Customer[] {
	return rows.map((cols, index) => {
		const [id, name, levelRaw, zone, currency] = cols

		if (!id || !name || !levelRaw || !zone || !currency) {
			throw new Error(`Invalid customer row at index ${index}`)
		}

		const level = levelRaw.trim().toUpperCase()
		if (!isCustomerLevel(level)) {
			throw new Error(`Invalid customer level "${levelRaw}" for customer ${id}`)
		}

		return {
			id: id.trim(),
			name: name.trim(),
			level,
			zone: zone.trim(),
			currency: currency.trim(),
		}
	})
}
