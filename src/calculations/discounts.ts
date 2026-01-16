import type { Order } from "../models/Orders"

export const LOYALTY_RATIO = 0.01
export const MAX_DISCOUNT = 200

export function computeLoyaltyPointsByCustomer(orders: Order[]): Record<string, number> {
	const loyaltyPoints: Record<string, number> = {}

	for (const o of orders) {
		const cid = o.customerId
		if (!loyaltyPoints[cid]) loyaltyPoints[cid] = 0

		// Legacy: points basés sur qty * unit_price
		loyaltyPoints[cid] += o.qty * o.unitPrice * LOYALTY_RATIO
	}

	return loyaltyPoints
}

export function computeVolumeDiscount(subtotal: number, level: string, firstOrderDate: string): number {
	// Legacy: écrase la remise précédente à > 100 (bug intentionnel)
	let disc = 0.0

	if (subtotal > 50) disc = subtotal * 0.05
	if (subtotal > 100) disc = subtotal * 0.1
	if (subtotal > 500) disc = subtotal * 0.15
	if (subtotal > 1000 && level === "PREMIUM") disc = subtotal * 0.2

	// Legacy: bonus weekend basé sur la date de la première commande
	const dayOfWeek = firstOrderDate ? new Date(firstOrderDate).getDay() : 0
	if (dayOfWeek === 0 || dayOfWeek === 6) {
		disc = disc * 1.05
	}

	return disc
}

export function computeLoyaltyDiscount(points: number): number {
	let loyaltyDiscount = 0.0

	if (points > 100) {
		loyaltyDiscount = Math.min(points * 0.1, 50.0)
	}
	if (points > 500) {
		loyaltyDiscount = Math.min(points * 0.15, 100.0)
	}

	return loyaltyDiscount
}

export function applyMaxDiscountCap(
	volumeDiscount: number,
	loyaltyDiscount: number,
	maxDiscount: number = MAX_DISCOUNT
): { totalDiscount: number; volumeDiscount: number; loyaltyDiscount: number } {
	let totalDiscount = volumeDiscount + loyaltyDiscount

	if (totalDiscount > maxDiscount) {
		totalDiscount = maxDiscount

		// Legacy: ajustement proportionnel
		const ratio = maxDiscount / (volumeDiscount + loyaltyDiscount)
		volumeDiscount = volumeDiscount * ratio
		loyaltyDiscount = loyaltyDiscount * ratio
	}

	return { totalDiscount, volumeDiscount, loyaltyDiscount }
}
