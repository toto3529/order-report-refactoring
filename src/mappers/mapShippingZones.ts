import type { ShippingZone } from "../models/ShippingZones"

export function mapShippingZones(rows: string[][]): ShippingZone[] {
	return rows.map((r) => {
		const zone = r[0]
		const base = Number(r[1])
		const perKg = Number(r[2] ?? "0.5")

		return { zone, base, perKg }
	})
}
