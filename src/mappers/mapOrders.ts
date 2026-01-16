import type { Order } from "../models/Orders"

export function mapOrders(rows: string[][]): Order[] {
	return rows
		.map((r) => {
			const qty = parseInt(r[3], 10)
			const unitPrice = Number(r[4])

			if (Number.isNaN(qty) || Number.isNaN(unitPrice)) return null

			return {
				id: r[0],
				customerId: r[1],
				productId: r[2],
				qty,
				unitPrice,
				date: r[5],
				promoCode: r[6] ?? "",
				time: r[7] ?? "12:00",
			} as Order
		})
		.filter((o): o is Order => o !== null)
}
