import { Product } from "../models/Products"

function toNumber(value: string, field: string, rowIndex: number, fallback?: number): number {
	const trimmed = value.trim()
	if (trimmed === "" && fallback !== undefined) return fallback

	const n = Number(trimmed)
	if (Number.isNaN(n)) {
		throw new Error(`Invalid number for ${field} at row ${rowIndex}: "${value}"`)
	}
	return n
}

export function mapProducts(rows: string[][]): Product[] {
	return rows.map((cols, index) => {
		const [id, name, category, priceRaw, weightRaw, taxableRaw] = cols

		if (!id || !name || !category || !priceRaw) {
			throw new Error(`Invalid product row at index ${index}`)
		}

		return {
			id: id,
			name: name,
			category: category,
			price: toNumber(priceRaw, "price", index),
			weight: toNumber(weightRaw ?? "", "weight", index, 1.0),
			taxable: (taxableRaw ?? "") === "true",
		}
	})
}
